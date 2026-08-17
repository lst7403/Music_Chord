# Demucs Audio Source Separation

This project separates music audio tracks (e.g. `data/music.mp3`) into individual stems (**Vocals**, **Drums**, **Bass**, **Other**) using Demucs' state-of-the-art `htdemucs` model, outputting directly into the `data/` directory.

---

## 🛠️ Environment Installation Guide

### Prerequisites
- [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or Anaconda
- NVIDIA GPU (Supports CUDA-enabled GPUs including RTX 30/40/50 series like **RTX 5090**)

---

### Step 1: Create Conda Environment
Create a new conda environment with Python 3.11:

```bash
conda create -n seperate python=3.11 -y
conda activate seperate
```

---

### Step 2: Install Demucs & Audio Dependencies
Install Demucs along with PyTorch, Torchaudio, SoundFile, and Jupyter Kernel:

```bash
pip install demucs ipykernel numpy torchaudio soundfile
```

> **Note for RTX 50-Series (RTX 5090 / Blackwell `sm_120`)**:
> Using Python 3.11 with the latest PyTorch / Demucs wheel automatically configures compatible CUDA 13/12.8 kernels, preventing `sm_120` incompatibility warnings.

---

### Step 3: Register Jupyter Kernel
Register the environment so it can be selected inside Jupyter Notebook or VS Code:

```bash
python -m ipykernel install --user --name seperate --display-name "Python (seperate)"
```

---

## 🚀 How to Run

### Method 1: Using the Jupyter Notebook (Recommended)
1. Open [`separate.ipynb`](./separate.ipynb).
2. Select the kernel: **`Python (seperate)`**.
3. Run all cells to:
   - Verify GPU status.
   - Listen to the original track.
   - Run `htdemucs` separation on `data/music.mp3`.
   - Play and inspect the separated stems directly in `data/`.

---

### Method 2: Using Command Line (CLI)
Make sure the conda environment is activated:

```bash
conda activate seperate
```

Run separation with relative paths, saving directly to `data/`:

```bash
demucs -n htdemucs -o data --filename "../{stem}.{ext}" data/music.mp3
```

#### Useful CLI Options:
- **Save directly as MP3 instead of WAV**:
  ```bash
  demucs -n htdemucs --mp3 -o data --filename "../{stem}.{ext}" data/music.mp3
  ```
- **Extract only Vocals + Instrumental (2 stems)**:
  ```bash
  demucs -n htdemucs --two-stems vocals -o data --filename "../{stem}.{ext}" data/music.mp3
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
├── separate.ipynb                    # Step-by-step separation notebook
└── README.md                         # Installation and usage instructions
```
