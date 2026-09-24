import shutil
import subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
import torch


def convert_to_mp3(input_file: Path, output_file: Path):
    """Convert any audio file format to standardized MP3 using ffmpeg."""
    input_file = Path(input_file)
    output_file = Path(output_file)
    output_file.parent.mkdir(parents=True, exist_ok=True)

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

    input_audio = Path(input_audio)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

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
    bass_path = Path(bass_path)
    other_path = Path(other_path)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

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
    drums_path = Path(drums_path)
    bass_path = Path(bass_path)
    other_path = Path(other_path)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    drums_audio, sr_drums = sf.read(str(drums_path))
    bass_audio, sr_bass = sf.read(str(bass_path))
    other_audio, sr_other = sf.read(str(other_path))

    min_len = min(len(drums_audio), len(bass_audio), len(other_audio))
    combined = drums_audio[:min_len] + bass_audio[:min_len] + other_audio[:min_len]

    max_val = np.max(np.abs(combined))
    if max_val > 1.0:
        combined = combined / max_val

    sf.write(str(output_path), combined, sr_drums)
