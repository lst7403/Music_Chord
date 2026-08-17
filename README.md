# Music Source Separation & Chord Recognition

This repository contains workflows and setup for:
1. **Audio Source Separation** using **Demucs** (`htdemucs`) to separate tracks into individual stems (**Vocals**, **Drums**, **Bass**, **Other**) directly into `data/`.
2. **Musical Chord Recognition** using the **BTC (Bi-directional Transformer for Chord Recognition)** model with Hugging Face integration.

---

## 🛠️ Environment Installation Guide

### Prerequisites
- [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or Anaconda
- NVIDIA GPU (Full support for RTX 30/40/50 series, including **RTX 5090** `sm_120`)

---

### Step 1: Create and Activate Conda Environment

```bash
conda create -n seperate python=3.11 -y
conda activate seperate
```

---

### Step 2: Install Dependencies

#### Option A: Install All Requirements (Demucs + Chord Recognition)
```bash
pip install demucs ipykernel numpy torchaudio soundfile librosa mir_eval scipy pandas huggingface_hub tqdm
```

#### Option B: If Demucs is already installed, add only Chord Recognition packages
```bash
pip install librosa mir_eval scipy pandas huggingface_hub
```

> **Note for RTX 50-Series (RTX 5090 / Blackwell `sm_120`)**:
> Using Python 3.11 with the latest PyTorch / Demucs wheel automatically configures compatible CUDA 13/12.8 kernels, preventing `sm_120` incompatibility warnings.

---

### Step 3: Register Jupyter Kernel

```bash
python -m ipykernel install --user --name seperate --display-name "Python (seperate)"
```

---

### Step 4: Verify Installed Packages

```bash
python -c "
packages = ['torch', 'torchaudio', 'demucs', 'librosa', 'mir_eval', 'soundfile', 'scipy', 'numpy', 'huggingface_hub', 'pandas', 'ipykernel']
for pkg in packages:
    try:
        mod = __import__(pkg)
        print(f'✅ {pkg:<16} : {getattr(mod, \"__version__\", \"installed\")}')
    except ImportError:
        print(f'❌ {pkg:<16} : NOT installed')
"
```

---

## 🚀 How to Run Audio Separation

### 1. Using Jupyter Notebook (Recommended)
1. Open [`separate.ipynb`](./separate.ipynb).
2. Select the kernel: **`Python (seperate)`**.
3. Run all cells:
   - Verifies GPU compatibility.
   - Separates `data/music.mp3` using `htdemucs`.
   - Saves stems directly to `data/` (`vocals.wav`, `drums.wav`, `bass.wav`, `other.wav`).
   - Checks and prints file sizes without bloating the notebook.

---

### 2. Using Command Line (CLI)

```bash
conda activate seperate
```

Separate audio and output directly to `data/`:
```bash
demucs -n htdemucs -o data --filename "../{stem}.{ext}" data/music.mp3
```

#### Useful CLI Options:
- **Save as MP3 instead of WAV**:
  ```bash
  demucs -n htdemucs --mp3 -o data --filename "../{stem}.{ext}" data/music.mp3
  ```
- **Extract only Vocals + Instrumental (2 stems)**:
  ```bash
  demucs -n htdemucs --two-stems vocals -o data --filename "../{stem}.{ext}" data/music.mp3
  ```

---

## 🎸 BTC Chord Recognition Overview

BTC uses a bi-directional transformer architecture on Constant-Q Transform (CQT) audio features to detect chord progressions with high temporal accuracy.

### Quick Inference / Model Loading Test

```python
import torch
import librosa
import soundfile as sf
from huggingface_hub import hf_hub_download

# Check GPU acceleration
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")
```

---

## 📂 Project Structure

```text
seperate/
├── data/
│   ├── music.mp3                     # Original input audio file
│   ├── vocals.wav                    # Isolated vocals stem
│   ├── drums.wav                     # Isolated drums stem
│   ├── bass.wav                      # Isolated bass line stem
│   └── other.wav                     # Remaining instruments stem
├── separate.ipynb                    # Demucs source separation notebook
└── README.md                         # Installation & usage documentation
```
