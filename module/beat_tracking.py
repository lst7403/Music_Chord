from pathlib import Path
from typing import Dict, Any, Optional, Union, List
import numpy as np
import pandas as pd
import torch

# Cached BeatThis model
_cached_beat_model = None


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


def predict_beats(
    audio_file: Union[str, Path],
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
    beat_results: Union[Dict[str, Any], pd.DataFrame],
    output_csv: Union[str, Path]
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
    chords_input: Union[str, Path, pd.DataFrame, list],
    beats_input: Union[str, Path, pd.DataFrame, list]
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
    aligned_results: Union[Dict[str, Any], pd.DataFrame],
    output_csv: Union[str, Path]
):
    """Save beat-aligned chord records to CSV."""
    output_csv = Path(output_csv)
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(aligned_results, pd.DataFrame):
        df = aligned_results
    else:
        df = aligned_results.get("df", pd.DataFrame(aligned_results.get("records", [])))
    df.to_csv(output_csv, index=False)
