"""
Unified Audio Processing Pipeline Orchestrator.

Orchestrates multi-stage audio processing pipeline:
1. Audio format conversion (FFmpeg)
2. Stem separation (Demucs)
3. Stem combination (Bass + Other, Instrumental)
4. Chord recognition (BTC Transformer)
5. Beat & downbeat tracking (BeatThis)
6. Beat-synchronous chord alignment

Underlying domain implementations are modularized in `module/`:
- `module.source_separation`
- `module.chord_recognition`
- `module.beat_tracking`
"""

import threading
import time
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd

from module import (
    # Source Separation
    convert_to_mp3,
    run_demucs_separation,
    combine_bass_and_other,
    combine_instrumental,
    # Chord Recognition
    get_btc_model,
    predict_chords,
    # Beat Tracking & Alignment
    get_beat_model,
    predict_beats,
    save_beats,
    align_chords_to_beats,
    save_aligned_chords,
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# Global pipeline state
pipeline_lock = threading.Lock()
pipeline_state: Dict[str, Any] = {
    "status": "idle",  # idle, running, completed, error
    "step": "idle",    # idle, converting, separating, combining, recognizing, tracking_beats, aligning, completed, error
    "progress": 0,     # 0 to 100
    "message": "Ready",
    "filename": "",
    "error": None,
    "started_at": None,
    "completed_at": None,
    "elapsed_seconds": 0,
}


def get_pipeline_status() -> Dict[str, Any]:
    """Retrieve current pipeline execution status safely."""
    with pipeline_lock:
        state_copy = dict(pipeline_state)
        if state_copy["status"] == "running" and state_copy["started_at"]:
            state_copy["elapsed_seconds"] = round(time.time() - state_copy["started_at"], 1)
        return state_copy


def update_status(step: str, progress: int, message: str, status: str = "running", error: Optional[str] = None):
    """Update global pipeline state thread-safely."""
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


def run_pipeline_task(temp_audio_file: Path, original_filename: str):
    """Background execution worker for complete audio processing pipeline."""
    try:
        temp_audio_file = Path(temp_audio_file)
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

        # 3. Combine Bass + Other & Full Instrumental
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

        # 4. BTC Chord Recognition
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

        # 5. Beat Tracking with beat_this
        update_status("tracking_beats", 85, "Tracking beats and downbeats with BeatThis AI...")
        beat_audio = music_mp3 if music_mp3.exists() else chord_input_audio
        beat_results = predict_beats(beat_audio)
        save_beats(beat_results, DATA_DIR / "beats.csv")

        # 6. Align Chords to Beats & Measures
        update_status("aligning", 92, "Aligning harmonic chords to rhythm beats and measures...")
        aligned_results = align_chords_to_beats(df_chords, beat_results.get("df", DATA_DIR / "beats.csv"))
        save_aligned_chords(aligned_results, DATA_DIR / "aligned_chords.csv")

        # 7. Complete
        update_status("completed", 100, f"Successfully processed {original_filename}!", status="completed")

    except Exception as e:
        import traceback
        traceback.print_exc()
        update_status("error", 0, f"Processing failed: {str(e)}", status="error", error=str(e))


__all__ = [
    # Pipeline Orchestration & State
    "get_pipeline_status",
    "update_status",
    "run_pipeline_task",
    "pipeline_state",
    "pipeline_lock",
    "DATA_DIR",
    "BASE_DIR",
    # Source Separation
    "convert_to_mp3",
    "run_demucs_separation",
    "combine_bass_and_other",
    "combine_instrumental",
    # Chord Recognition
    "get_btc_model",
    "predict_chords",
    # Beat Tracking & Alignment
    "get_beat_model",
    "predict_beats",
    "save_beats",
    "align_chords_to_beats",
    "save_aligned_chords",
]
