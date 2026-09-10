"""
Chord Vision - Audio Processing Modules.

This package contains decoupled submodules for:
1. source_separation: Demucs stem separation, audio format conversion, and stem mixing.
2. chord_recognition: BTC Transformer chord recognition inference and model caching.
3. beat_tracking: BeatThis beat & downbeat tracking and beat-synchronous chord alignment.
"""

from .source_separation import (
    convert_to_mp3,
    run_demucs_separation,
    combine_bass_and_other,
    combine_instrumental,
)

from .chord_recognition import (
    get_btc_model,
    predict_chords,
)

from .beat_tracking import (
    get_beat_model,
    predict_beats,
    save_beats,
    align_chords_to_beats,
    save_aligned_chords,
)

__all__ = [
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
