from pathlib import Path
from typing import Optional, List, Dict, Any
import numpy as np
import torch

# Cached BTC model
_cached_model = None


def get_btc_model():
    """Load and cache the BTC chord recognition model."""
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


@torch.no_grad()
def predict_chords(btc_wrapper, audio_file: Path, progress_callback=None, show_progress: bool = False) -> List[Dict[str, Any]]:
    """Extract chords from audio using BTC model."""
    import importlib
    features = importlib.import_module("btc_src.features")

    audio_file = Path(audio_file)
    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_file}")

    if show_progress:
        print("1/2 Extracting log-CQT audio spectrogram features...")

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
