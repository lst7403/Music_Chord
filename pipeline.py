import os
import shutil
import subprocess
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, Any, Optional

import numpy as np
import pandas as pd
import soundfile as sf
import torch

# --- Windows Security / WDAC Numba Compatibility Shim ---
# Windows Smart App Control often blocks unsigned PyPI C-extension DLLs like numba._helperlib.
# Librosa only uses numba for optional JIT decoration; this shim provides pure Python stubs so
# CQT feature extraction and chord recognition run seamlessly on Windows without any DLL errors.
try:
    import numba
except Exception:
    import sys
    import types
    m = types.ModuleType("numba")
    m.jit = m.njit = m.guvectorize = m.stencil = lambda *a, **k: (lambda f: f) if not (len(a) == 1 and callable(a[0])) else a[0]
    m.vectorize = lambda *a, **k: (lambda f: np.vectorize(f))
    class DummyDispatcher:
        pass
    m_reg = types.ModuleType("registry")
    m_reg.CPUDispatcher = DummyDispatcher
    m_core = types.ModuleType("core")
    m_core.registry = m_reg
    m.core = m_core
    sys.modules["numba"] = m
    sys.modules["numba.core"] = m_core
    sys.modules["numba.core.registry"] = m_reg

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
# Cached BeatThis model
_cached_beat_model = None


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


def get_beat_model(checkpoint_path: str = "final0", device: Optional[str] = None, dbn: bool = False):
    """Load and cache the BeatThis model for beat and downbeat tracking."""
    global _cached_beat_model
    if _cached_beat_model is None:
        from beat_this.inference import File2Beats
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        _cached_beat_model = File2Beats(
            checkpoint_path=checkpoint_path,
            device=device,
            dbn=dbn
        )
    return _cached_beat_model


def get_ffmpeg_executable() -> str:
    """Find FFmpeg binary: check imageio-ffmpeg first, then fallback to system ffmpeg."""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def convert_to_mp3(input_file: Path, output_file: Path):
    """Convert any audio file format to standardized MP3 using ffmpeg."""
    ffmpeg_exe = get_ffmpeg_executable()
    cmd = [
        ffmpeg_exe, "-y",
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


def download_youtube_audio(url: str, output_file: Path, progress_callback=None) -> str:
    """Download audio from a YouTube URL and convert to high-quality MP3."""
    import yt_dlp

    ffmpeg_exe = get_ffmpeg_executable()
    output_file = Path(output_file)
    output_dir = output_file.parent
    output_dir.mkdir(parents=True, exist_ok=True)

    temp_id = uuid.uuid4().hex[:8]
    outtmpl = str(output_dir / f"yt_dl_{temp_id}.%(ext)s")

    def ydl_hook(d):
        if progress_callback and d.get('status') == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
            downloaded = d.get('downloaded_bytes', 0)
            if total > 0:
                pct = int((downloaded / total) * 100)
                progress_callback(pct)

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': outtmpl,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320',
        }],
        'ffmpeg_location': ffmpeg_exe,
        'quiet': True,
        'no_warnings': True,
        'progress_hooks': [ydl_hook] if progress_callback else [],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        title = info.get('title', 'YouTube Audio')

    expected_mp3 = output_dir / f"yt_dl_{temp_id}.mp3"
    if not expected_mp3.exists():
        matches = list(output_dir.glob(f"yt_dl_{temp_id}*.mp3"))
        if matches:
            expected_mp3 = matches[0]
        else:
            raise RuntimeError("YouTube audio download failed: converted MP3 file not found.")

    if output_file.exists():
        try:
            output_file.unlink()
        except Exception:
            pass

    shutil.move(str(expected_mp3), str(output_file))
    return title


def run_demucs_separation(input_audio: Path, output_dir: Path, progress_callback=None):
    """Run Demucs source separation to produce vocals, drums, bass, other with real-time progress callbacks."""
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model_name = "htdemucs"

    try:
        from demucs.separate import Separator, save_audio

        def demucs_cb(d):
            if progress_callback:
                offset = d.get("segment_offset", 0)
                total = d.get("audio_length", 1)
                if total > 0:
                    pct = min(100, max(0, int((offset / total) * 100)))
                    progress_callback(pct)

        separator = Separator(
            model=model_name,
            device=device,
            callback=demucs_cb if progress_callback else None
        )

        origin, separated = separator.separate_audio_file(Path(input_audio))
        for stem_name, stem_tensor in separated.items():
            stem_out = output_dir / f"{stem_name}.wav"
            save_audio(stem_tensor, stem_out, samplerate=separator.samplerate)

        if progress_callback:
            progress_callback(100)

    except Exception as e:
        print(f"Demucs Separator callback failed ({e}), falling back to Demucs CLI...")
        import demucs.separate
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

        if progress_callback:
            progress_callback(100)


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


def combine_instrumental(drums_path: Path, bass_path: Path, other_path: Path, output_path: Path):
    """Merge drums, bass, and other stems into full instrumental backing track."""
    drums_audio, sr_drums = sf.read(str(drums_path))
    bass_audio, sr_bass = sf.read(str(bass_path))
    other_audio, sr_other = sf.read(str(other_path))

    min_len = min(len(drums_audio), len(bass_audio), len(other_audio))
    combined = drums_audio[:min_len] + bass_audio[:min_len] + other_audio[:min_len]

    max_val = np.max(np.abs(combined))
    if max_val > 1.0:
        combined = combined / max_val

    sf.write(str(output_path), combined, sr_drums)


@torch.no_grad()
def predict_chords(btc_wrapper, audio_file: Path, progress_callback=None, show_progress: bool = False):
    """Extract chords from audio using BTC model."""
    import importlib
    features = importlib.import_module("btc_src.features")

    if show_progress:
        print("1/2 Extracting log-CQT audio spectrogram features...")

    # Load audio cleanly via soundfile & scipy to ensure compatibility without librosa.load
    wav_data, sr_in = sf.read(str(audio_file))
    if wav_data.ndim > 1:
        wav_data = wav_data.mean(axis=1)
    if sr_in != 22050:
        import scipy.signal
        target_len = int(len(wav_data) * 22050 / sr_in)
        wav_data = scipy.signal.resample(wav_data, target_len)
    wav_mono = wav_data.astype(np.float32)

    feat = features.audio_to_features(
        wav_mono,
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

    if show_progress:
        from tqdm.auto import tqdm
        print(f"2/2 Running Transformer inference across {num_instance} audio chunks:")
        iterator = tqdm(range(num_instance), desc="Predicting Chords", unit="chunk")
    else:
        iterator = range(num_instance)

    for t in iterator:
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


def predict_beats(
    audio_file: Path,
    model=None,
    checkpoint_path: str = "final0",
    dbn: bool = False,
    show_progress: bool = False
) -> Dict[str, Any]:
    """
    Extract beats and downbeats from audio using BeatThis model.

    Returns a dictionary containing:
        - "beats": np.ndarray of beat times in seconds
        - "downbeats": np.ndarray of downbeat times in seconds
        - "beat_numbers": np.ndarray of beat positions within measures (1, 2, 3, ...)
        - "bpm": Estimated average BPM (tempo)
        - "df": pandas DataFrame with columns ['time', 'beat', 'is_downbeat']
        - "records": list of dicts [{'time': ..., 'beat': ..., 'is_downbeat': ...}]
    """
    audio_file = Path(audio_file)
    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_file}")

    if show_progress:
        print(f"Loading BeatThis model and tracking beats for: {audio_file.name}...")

    if model is None:
        model = get_beat_model(checkpoint_path=checkpoint_path, dbn=dbn)

    # Perform inference
    beats, downbeats = model(str(audio_file))

    # Infer beat numbers (e.g. 1 = downbeat, 2, 3, 4...)
    beat_numbers = None
    try:
        import beat_this.utils as btu
        beat_numbers = btu.infer_beat_numbers(beats, downbeats)
    except Exception:
        # Fallback if downbeats cannot be matched exactly
        if len(beats) > 0:
            downbeat_set = set(np.round(downbeats, 3))
            nums = []
            cnt = 1
            for b in beats:
                if round(b, 3) in downbeat_set:
                    cnt = 1
                nums.append(cnt)
                cnt += 1
            beat_numbers = np.array(nums, dtype=int)
        else:
            beat_numbers = np.array([], dtype=int)

    # Compute estimated tempo / BPM
    if len(beats) > 1:
        intervals = np.diff(beats)
        valid_intervals = intervals[(intervals > 0.2) & (intervals < 2.0)]
        if len(valid_intervals) > 0:
            bpm = float(60.0 / np.median(valid_intervals))
        else:
            bpm = float(60.0 / np.mean(intervals))
    else:
        bpm = 0.0

    is_downbeat_mask = np.isin(np.round(beats, 3), np.round(downbeats, 3)) if len(beats) > 0 else np.array([], dtype=bool)

    df_beats = pd.DataFrame({
        "time": np.round(beats, 3),
        "beat": beat_numbers if beat_numbers is not None and len(beat_numbers) == len(beats) else [1] * len(beats),
        "is_downbeat": is_downbeat_mask
    })

    records = df_beats.to_dict(orient="records")

    if show_progress:
        print(f"✓ Detected {len(beats)} beats ({len(downbeats)} downbeats). Estimated tempo: {bpm:.1f} BPM.")

    return {
        "beats": beats,
        "downbeats": downbeats,
        "beat_numbers": beat_numbers,
        "bpm": round(bpm, 2),
        "df": df_beats,
        "records": records
    }


def save_beats(
    beat_results: Dict[str, Any] | pd.DataFrame,
    output_csv: Path
):
    """Save detected beats to CSV format."""
    output_csv = Path(output_csv)
    output_csv.parent.mkdir(parents=True, exist_ok=True)

    if isinstance(beat_results, pd.DataFrame):
        df = beat_results
    else:
        df = beat_results.get("df", pd.DataFrame(beat_results.get("records", [])))

    df.to_csv(output_csv, index=False)


def align_chords_to_beats(
    chords_input: Path | pd.DataFrame | list,
    beats_input: Path | pd.DataFrame | list
) -> Dict[str, Any]:
    """
    Align raw continuous chord predictions to discrete musical beats and measures.
    Calculates the dominant harmonic chord for each beat interval and groups into measures (bars).

    Returns a dictionary containing:
        - "records": List of aligned beat-chord items
        - "measures": Grouped measure/bar items for lead sheet visualization
        - "df": pandas DataFrame
        - "total_measures": int
        - "total_beats": int
        - "bpm": float
    """
    # Load chords
    if isinstance(chords_input, (str, Path)):
        df_chords = pd.read_csv(chords_input)
    elif isinstance(chords_input, pd.DataFrame):
        df_chords = chords_input
    elif isinstance(chords_input, list):
        df_chords = pd.DataFrame(chords_input)
    else:
        df_chords = pd.DataFrame(columns=["start", "end", "chord"])

    # Load beats
    if isinstance(beats_input, (str, Path)):
        df_beats = pd.read_csv(beats_input)
    elif isinstance(beats_input, pd.DataFrame):
        df_beats = beats_input
    elif isinstance(beats_input, list):
        df_beats = pd.DataFrame(beats_input)
    else:
        df_beats = pd.DataFrame(columns=["time", "beat", "is_downbeat"])

    if df_beats.empty:
        return {
            "records": [],
            "measures": [],
            "df": pd.DataFrame(),
            "total_measures": 0,
            "total_beats": 0,
            "bpm": 0.0
        }

    beat_times = df_beats["time"].astype(float).values
    beat_nums = df_beats["beat"].astype(int).values if "beat" in df_beats.columns else [1] * len(beat_times)
    is_downbeats = df_beats["is_downbeat"].astype(bool).values if "is_downbeat" in df_beats.columns else [False] * len(beat_times)

    if len(beat_times) > 1:
        diffs = np.diff(beat_times)
        valid = diffs[(diffs > 0.2) & (diffs < 2.0)]
        median_interval = float(np.median(valid)) if len(valid) > 0 else 0.5
        bpm = round(60.0 / median_interval, 1)
    else:
        median_interval = 0.5
        bpm = 0.0

    aligned_records = []
    measures_dict = {}
    measure_counter = 0

    for i in range(len(beat_times)):
        t_start = float(beat_times[i])
        t_end = float(beat_times[i + 1]) if i + 1 < len(beat_times) else t_start + median_interval
        b_num = int(beat_nums[i])
        is_db = bool(is_downbeats[i])

        if is_db:
            measure_counter += 1
        elif measure_counter == 0:
            measure_counter = 1

        # Calculate overlap with chord intervals
        overlap_dict = {}
        if not df_chords.empty:
            for _, row in df_chords.iterrows():
                try:
                    c_start = float(row["start"])
                    c_end = float(row["end"])
                    chord = str(row["chord"]).strip()
                    overlap = max(0.0, min(t_end, c_end) - max(t_start, c_start))
                    if overlap > 0:
                        overlap_dict[chord] = overlap_dict.get(chord, 0.0) + overlap
                except Exception:
                    continue

        if overlap_dict:
            dominant_chord = max(overlap_dict.items(), key=lambda x: x[1])[0]
        else:
            dominant_chord = "N"

        rec = {
            "measure": measure_counter,
            "beat": b_num,
            "time": round(t_start, 3),
            "end_time": round(t_end, 3),
            "duration": round(t_end - t_start, 3),
            "is_downbeat": is_db,
            "chord": dominant_chord
        }
        aligned_records.append(rec)

        # Group by measure
        if measure_counter not in measures_dict:
            measures_dict[measure_counter] = {
                "measure": measure_counter,
                "start": round(t_start, 3),
                "end": round(t_end, 3),
                "beats": [],
                "chords": [],
                "summary": ""
            }
        measures_dict[measure_counter]["end"] = round(t_end, 3)
        measures_dict[measure_counter]["beats"].append({
            "beat": b_num,
            "time": round(t_start, 3),
            "end_time": round(t_end, 3),
            "chord": dominant_chord,
            "is_downbeat": is_db
        })
        if dominant_chord not in measures_dict[measure_counter]["chords"]:
            measures_dict[measure_counter]["chords"].append(dominant_chord)

    # Format summary strings
    measures_list = []
    for m_num in sorted(measures_dict.keys()):
        m_data = measures_dict[m_num]
        chords_in_order = []
        for b in m_data["beats"]:
            if not chords_in_order or chords_in_order[-1] != b["chord"]:
                chords_in_order.append(b["chord"])
        m_data["summary"] = " → ".join(chords_in_order)
        measures_list.append(m_data)

    df_aligned = pd.DataFrame(aligned_records)

    return {
        "records": aligned_records,
        "measures": measures_list,
        "df": df_aligned,
        "total_measures": len(measures_list),
        "total_beats": len(aligned_records),
        "bpm": bpm
    }


def save_aligned_chords(
    aligned_results: Dict[str, Any] | pd.DataFrame,
    output_csv: Path
):
    """Save beat-aligned chord records to CSV."""
    output_csv = Path(output_csv)
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(aligned_results, pd.DataFrame):
        df = aligned_results
    else:
        df = aligned_results.get("df", pd.DataFrame(aligned_results.get("records", [])))
    df.to_csv(output_csv, index=False)


def _run_core_pipeline(music_mp3: Path, display_name: str):
    """Core audio processing pipeline: Demucs, Combine, BTC Chords, Beat Tracking, Alignment."""
    # 2. Demucs Separation (25% -> 60%)
    update_status("separating", 25, "Running Demucs AI stem separation (0%)...")

    def demucs_progress(pct):
        overall = 25 + int(pct * 0.35)  # 25% -> 60%
        update_status("separating", overall, f"Demucs AI separating stems ({pct}%)...")

    run_demucs_separation(music_mp3, DATA_DIR, progress_callback=demucs_progress)

    # 3. Combine Bass + Other & Full Instrumental (60% -> 70%)
    update_status("combining", 60, "Synthesizing harmonic accompaniment & instrumental backing tracks...")
    drums_file = DATA_DIR / "drums.wav"
    bass_file = DATA_DIR / "bass.wav"
    other_file = DATA_DIR / "other.wav"
    accompaniment_file = DATA_DIR / "bass_other.wav"
    instrumental_file = DATA_DIR / "instrumental.wav"

    if bass_file.exists() and other_file.exists():
        combine_bass_and_other(bass_file, other_file, accompaniment_file)
        chord_input_audio = accompaniment_file
    else:
        chord_input_audio = music_mp3

    if drums_file.exists() and bass_file.exists() and other_file.exists():
        combine_instrumental(drums_file, bass_file, other_file, instrumental_file)

    # 4. BTC Chord Recognition (70% -> 85%)
    update_status("recognizing", 70, "Running Transformer AI chord recognition...")
    btc_model = get_btc_model()

    def chord_progress(pct):
        overall_progress = 70 + int(pct * 0.15)
        update_status("recognizing", overall_progress, f"Predicting chords ({pct}%)...")

    raw_chords = predict_chords(btc_model, chord_input_audio, progress_callback=chord_progress)

    # Save to chords.csv
    df_chords = pd.DataFrame(raw_chords)
    if not df_chords.empty:
        df_chords["duration"] = (df_chords["end"] - df_chords["start"]).round(3)
    else:
        df_chords = pd.DataFrame(columns=["start", "end", "chord", "duration"])

    df_chords.to_csv(DATA_DIR / "chords.csv", index=False)

    # 5. Beat Tracking with beat_this (85% -> 92%)
    update_status("tracking_beats", 86, "Tracking beats and downbeats with BeatThis AI...")
    beat_audio = music_mp3 if music_mp3.exists() else chord_input_audio
    beat_results = predict_beats(beat_audio)
    save_beats(beat_results, DATA_DIR / "beats.csv")

    # 6. Align Chords to Beats & Measures (92% -> 100%)
    update_status("aligning", 94, "Aligning harmonic chords to rhythm beats and measures...")
    aligned_results = align_chords_to_beats(df_chords, beat_results.get("df", DATA_DIR / "beats.csv"))
    save_aligned_chords(aligned_results, DATA_DIR / "aligned_chords.csv")

    # 7. Complete
    update_status("completed", 100, f"Successfully processed {display_name}!", status="completed")


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

        _run_core_pipeline(music_mp3, original_filename)

    except Exception as e:
        import traceback
        traceback.print_exc()
        update_status("error", 0, f"Processing failed: {str(e)}", status="error", error=str(e))


def run_youtube_pipeline_task(youtube_url: str):
    """Background execution worker for downloading YouTube audio and running complete pipeline."""
    try:
        with pipeline_lock:
            pipeline_state["status"] = "running"
            pipeline_state["step"] = "downloading"
            pipeline_state["progress"] = 5
            pipeline_state["message"] = "Connecting to YouTube and fetching audio stream..."
            pipeline_state["filename"] = "YouTube Video"
            pipeline_state["error"] = None
            pipeline_state["started_at"] = time.time()
            pipeline_state["completed_at"] = None

        music_mp3 = DATA_DIR / "music.mp3"

        def dl_progress(pct):
            overall_pct = 5 + int(pct * 0.15)
            update_status("downloading", overall_pct, f"Downloading YouTube audio ({pct}%)...")

        update_status("downloading", 8, "Downloading high-fidelity audio stream from YouTube...")
        video_title = download_youtube_audio(youtube_url, music_mp3, progress_callback=dl_progress)

        with pipeline_lock:
            pipeline_state["filename"] = f"{video_title}.mp3"

        _run_core_pipeline(music_mp3, f"{video_title}.mp3")

    except Exception as e:
        import traceback
        traceback.print_exc()
        update_status("error", 0, f"Processing failed: {str(e)}", status="error", error=str(e))
