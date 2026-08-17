import os
import shutil
import subprocess
import threading
import time
from pathlib import Path
from typing import Dict, Any, Optional

import numpy as np
import pandas as pd
import soundfile as sf
import torch

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# Global pipeline state
pipeline_lock = threading.Lock()
pipeline_state: Dict[str, Any] = {
    "status": "idle",  # idle, running, completed, error
    "step": "idle",    # idle, converting, separating, combining, recognizing, completed, error
    "progress": 0,     # 0 to 100
    "message": "Ready",
    "filename": "",
    "error": None,
    "started_at": None,
    "completed_at": None,
    "elapsed_seconds": 0,
}

# Cached BTC model
_cached_model = None


def get_pipeline_status() -> Dict[str, Any]:
    with pipeline_lock:
        state_copy = dict(pipeline_state)
        if state_copy["status"] == "running" and state_copy["started_at"]:
            state_copy["elapsed_seconds"] = round(time.time() - state_copy["started_at"], 1)
        return state_copy


def update_status(step: str, progress: int, message: str, status: str = "running", error: Optional[str] = None):
    with pipeline_lock:
        pipeline_state["status"] = status
        pipeline_state["step"] = step
        pipeline_state["progress"] = progress
        pipeline_state["message"] = message
        pipeline_state["error"] = error
        if status == "completed":
            pipeline_state["completed_at"] = time.time()
            if pipeline_state["started_at"]:
                pipeline_state["elapsed_seconds"] = round(pipeline_state["completed_at"] - pipeline_state["started_at"], 1)


def get_btc_model():
    global _cached_model
    if _cached_model is None:
        from transformers import AutoModel
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _cached_model = AutoModel.from_pretrained(
            "puar-playground/btc-chord",
            trust_remote_code=True,
            device=device,
            large_voca=True
        )
    return _cached_model


def convert_to_mp3(input_file: Path, output_file: Path):
    """Convert any audio file format to standardized MP3 using ffmpeg."""
    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_file),
        "-vn",
        "-ar", "44100",
        "-ac", "2",
        "-b:a", "320k",
        str(output_file)
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg audio conversion failed: {res.stderr.decode('utf-8', errors='ignore')}")


def run_demucs_separation(input_audio: Path, output_dir: Path):
    """Run Demucs source separation to produce vocals, drums, bass, other."""
    import demucs.separate
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model_name = "htdemucs"

    cmd_args = [
        "-n", model_name,
        "-o", str(output_dir),
        "-d", device,
        "--filename", "../{stem}.{ext}",
        str(input_audio)
    ]
    demucs.separate.main(cmd_args)

    # Clean up empty htdemucs folder if created
    extra_folder = output_dir / model_name
    if extra_folder.exists() and not any(extra_folder.iterdir()):
        shutil.rmtree(extra_folder)


def combine_bass_and_other(bass_path: Path, other_path: Path, output_path: Path):
    """Merge bass and other stems into harmonic accompaniment for chord estimation."""
    bass_audio, sr_bass = sf.read(str(bass_path))
    other_audio, sr_other = sf.read(str(other_path))

    min_len = min(len(bass_audio), len(other_audio))
    combined = bass_audio[:min_len] + other_audio[:min_len]

    max_val = np.max(np.abs(combined))
    if max_val > 1.0:
        combined = combined / max_val

    sf.write(str(output_path), combined, sr_bass)


@torch.no_grad()
def predict_chords(btc_wrapper, audio_file: Path, progress_callback=None):
    """Extract chords from audio using BTC model."""
    import importlib
    features = importlib.import_module("btc_src.features")

    feat = features.audio_to_features(
        str(audio_file),
        sr_target=22050,
        inst_len=10.0,
        n_bins=144,
        bins_per_octave=24,
        hop_length=2048,
    )
    feat = feat.T
    feat = (feat - btc_wrapper._mean) / btc_wrapper._std

    timestep = 108
    time_unit = 10.0 / timestep
    n = timestep

    num_pad = n - (feat.shape[0] % n)
    feat = np.pad(feat, ((0, num_pad), (0, 0)), mode="constant", constant_values=0)
    num_instance = feat.shape[0] // n

    x = torch.tensor(feat, dtype=torch.float32).unsqueeze(0).to(btc_wrapper._device)
    lines = []
    start_time = 0.0
    prev = None

    for t in range(num_instance):
        attn_out, _ = btc_wrapper.model.self_attn_layers(x[:, n * t : n * (t + 1), :])
        pred, _ = btc_wrapper.model.output_layer(attn_out)
        pred = pred.squeeze()

        for i in range(n):
            if t == 0 and i == 0:
                prev = pred[i].item()
                continue
            cur = pred[i].item()
            if cur != prev:
                end = time_unit * (n * t + i)
                lines.append({
                    "start": round(start_time, 3),
                    "end": round(end, 3),
                    "chord": btc_wrapper._idx_to_chord[prev]
                })
                start_time = end
                prev = cur
            if t == num_instance - 1 and i + num_pad == n:
                end = time_unit * (n * t + i)
                if start_time != end:
                    lines.append({
                        "start": round(start_time, 3),
                        "end": round(end, 3),
                        "chord": btc_wrapper._idx_to_chord[prev]
                    })
                break

        if progress_callback and num_instance > 0:
            progress_callback(int((t + 1) / num_instance * 100))

    return lines


def run_pipeline_task(temp_audio_file: Path, original_filename: str):
    """Background execution worker for complete audio processing pipeline."""
    try:
        with pipeline_lock:
            pipeline_state["status"] = "running"
            pipeline_state["step"] = "converting"
            pipeline_state["progress"] = 5
            pipeline_state["message"] = f"Converting audio: {original_filename}"
            pipeline_state["filename"] = original_filename
            pipeline_state["error"] = None
            pipeline_state["started_at"] = time.time()
            pipeline_state["completed_at"] = None

        music_mp3 = DATA_DIR / "music.mp3"

        # 1. Convert uploaded file to data/music.mp3
        update_status("converting", 15, "Standardizing audio format to MP3...")
        convert_to_mp3(temp_audio_file, music_mp3)

        # Remove temp uploaded file if different
        if temp_audio_file.exists() and temp_audio_file.resolve() != music_mp3.resolve():
            try:
                temp_audio_file.unlink()
            except Exception:
                pass

        # 2. Demucs Separation
        update_status("separating", 25, "Running Demucs AI stem separation (Vocals, Drums, Bass, Other)...")
        run_demucs_separation(music_mp3, DATA_DIR)

        # 3. Combine Bass + Other
        update_status("combining", 65, "Synthesizing harmonic accompaniment (Bass + Other)...")
        bass_file = DATA_DIR / "bass.wav"
        other_file = DATA_DIR / "other.wav"
        accompaniment_file = DATA_DIR / "bass_other.wav"

        if bass_file.exists() and other_file.exists():
            combine_bass_and_other(bass_file, other_file, accompaniment_file)
            chord_input_audio = accompaniment_file
        else:
            chord_input_audio = music_mp3

        # 4. BTC Chord Recognition
        update_status("recognizing", 75, "Running Transformer AI chord recognition...")
        btc_model = get_btc_model()

        def chord_progress(pct):
            overall_progress = 75 + int(pct * 0.20)
            update_status("recognizing", overall_progress, f"Predicting chords ({pct}%)...")

        raw_chords = predict_chords(btc_model, chord_input_audio, progress_callback=chord_progress)

        # Save to chords.csv
        df_chords = pd.DataFrame(raw_chords)
        if not df_chords.empty:
            df_chords["duration"] = (df_chords["end"] - df_chords["start"]).round(3)
        else:
            df_chords = pd.DataFrame(columns=["start", "end", "chord", "duration"])

        df_chords.to_csv(DATA_DIR / "chords.csv", index=False)

        # 5. Complete
        update_status("completed", 100, f"Successfully processed {original_filename}!", status="completed")

    except Exception as e:
        import traceback
        traceback.print_exc()
        update_status("error", 0, f"Processing failed: {str(e)}", status="error", error=str(e))
