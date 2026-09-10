# Music Source Separation & Chord Recognition Web App

This repository contains a full pipeline and interactive web application for:
1. **Audio Source Separation** using **Demucs** (`htdemucs`) to separate tracks into individual stems (**Vocals**, **Drums**, **Bass**, **Other**) directly into `data/`.
2. **Audio Stem Combination** (`combine.ipynb`) to merge isolated stems (**Bass + Other**) into harmonic accompaniment (`data/bass_other.wav`).
3. **Musical Chord Recognition** using the **BTC (Bi-directional Transformer for Chord Recognition)** model (`puar-playground/btc-chord`) on harmonic accompaniment.
4. **Beat & Downbeat Tracking** (`beat.ipynb`) using the **`beat_this`** state-of-the-art transformer model to detect beat timestamps, measure downbeats, and estimate song tempo (BPM).
5. **Interactive FastAPI Web App** (`app.py`) for synchronized real-time chord visualization, interactive piano voicing, dynamic guitar chord fretboard diagrams, multi-stem audio switching, pitch transposition, and scrubbable timeline.
6. **Notebook Server Control** (`server.ipynb`) to start, monitor, and stop the web server directly inside a Jupyter notebook.

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

### Step 2: Install All Dependencies

Install PyTorch and TorchAudio for your CUDA version (e.g. CUDA 12.8 / 13.0):

```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu130
pip install demucs beat-this
pip install ipykernel numpy soundfile librosa transformers huggingface_hub scipy pandas tqdm fastapi uvicorn python-multipart
```

> **Note**: `beat-this` is the state-of-the-art transformer model used for automatic beat and downbeat tracking in [`beat.ipynb`](./notebooks/beat.ipynb). You can install it directly via `pip install beat-this`.

---

## 🚀 Step-by-Step Processing Pipeline (Notebooks)

All notebooks import from modular components in [`module/`](./module) (or [`pipeline.py`](./pipeline.py)):

1. **[`separate.ipynb`](./notebooks/separate.ipynb)**: Runs Demucs source separation on `data/music.mp3` &rarr; outputs isolated stems (`vocals.wav`, `drums.wav`, `bass.wav`, `other.wav`).
2. **[`combine.ipynb`](./notebooks/combine.ipynb)**: Merges stems &rarr; generates `data/bass_other.wav` (harmonic accompaniment) and `data/instrumental.wav` (backing track).
3. **[`chord_recognition.ipynb`](./notebooks/chord_recognition.ipynb)**: Runs BTC Transformer on GPU &rarr; exports timeline to `data/chords.csv`.
4. **[`beat.ipynb`](./notebooks/beat.ipynb)**: Runs BeatThis Transformer on GPU &rarr; extracts beat and downbeat timestamps and exports to `data/beats.csv`.
5. **[`align.ipynb`](./notebooks/align.ipynb)**: Aligns chord intervals to discrete rhythm beats and measures &rarr; exports quantized lead sheet to `data/aligned_chords.csv`.

---

## 🌐 How to Run the Chord Web App

### Option A: Using the Notebook Controller (Recommended)
Open [`server.ipynb`](./notebooks/server.ipynb):
- Run **Cell 2 (`start_server()`)** to launch the server asynchronously in the background.
- Run **Cell 3 (`check_status()`)** to verify health and available stems.
- Run **Cell 4 (`stop_server()`)** to cleanly stop the server and free port 8080.

---

### Option B: Using the Command Line
```bash
python app.py
```
*(Or `uvicorn app:app --host 0.0.0.0 --port 8080 --reload`)*

Then open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 🎸 Web App Features

- **Instrument Mode Switcher**:
  - 🎸 **Guitar Mode**: Dynamic SVG Guitar Chord Boxes showing 6 strings, frets, finger positions, and barres.
  - 🎹 **Piano Mode**: Interactive 2-octave keyboard lighting up chord notes (root, 3rd, 5th, 7th).
  - 🎼 **Both Mode**: View both instruments simultaneously.
- **Audio Stem Switcher**: Toggle between Full Mix (`music.mp3`), Instrumental Backing Track (`instrumental.wav`), Accompaniment (`bass_other.wav`), Vocals, Drums, Bass, and Other.
- **Live Transposition**: Transpose the whole song key up/down by semitones in real-time (`-` / `+` / `Reset`).
- **Scrubbable Color Timeline**: Visual chord blocks positioned along the timeline; click anywhere to jump immediately to that point in the track.
- **Auto-Scrolling Progression Sheet**: Grid of chord cards with search/filter capabilities.

---

## 📂 Project Structure

```text
seperate/
├── data/
│   ├── music.mp3                     # Original input audio file
│   ├── vocals.wav                    # Isolated vocals stem
│   ├── drums.wav                     # Isolated drums stem
│   ├── bass.wav                      # Isolated bass line stem
│   ├── other.wav                     # Remaining instruments stem
│   ├── bass_other.wav                # Combined harmonic accompaniment (Bass + Other)
│   ├── instrumental.wav              # Combined instrumental backing track (Drums + Bass + Other)
│   ├── chords.csv                    # Chord timeline (CSV format)
│   └── beats.csv                     # Beat and downbeat timestamps (CSV format)
├── static/
│   ├── index.html                    # Frontend user interface
│   ├── style.css                     # Modern dark glassmorphism theme
│   ├── app.js                        # Main entry point
│   └── js/                           # Modular Frontend JavaScript
│       ├── constants.js              # Pitch classes, colors, chord databases
│       ├── music.js                  # Transposition, note & shape calculators
│       ├── guitar.js                 # SVG Guitar Chord & Fretboard renderer
│       ├── piano.js                  # Virtual Piano keyboard builder
│       ├── timeline.js               # Timeline overview & progression sheet
│       └── main.js                   # Application controller & state sync
├── module/                           # Decoupled AI & audio processing modules
│   ├── __init__.py                   # Module package exports
│   ├── source_separation.py          # Demucs stem separation, FFmpeg audio conversion & stem mixing
│   ├── chord_recognition.py          # BTC Transformer chord model loading & inference
│   └── beat_tracking.py              # BeatThis beat & downbeat tracking & beat-chord alignment
├── notebooks/                        # Interactive Jupyter notebooks
│   ├── server.ipynb                  # Server controller notebook (start / check / stop)
│   ├── separate.ipynb                # Step 1: Demucs source separation notebook
│   ├── combine.ipynb                 # Step 2: Audio stem combination notebook
│   ├── chord_recognition.ipynb       # Step 3: BTC chord recognition notebook
│   ├── beat.ipynb                    # Step 4: BeatThis beat & downbeat tracking notebook
│   └── align.ipynb                   # Step 5: Beat-synchronous chord alignment notebook
├── pipeline.py                       # Unified audio, chord & beat AI processing engine (orchestrator)
├── app.py                            # FastAPI backend server
├── README.md                         # Installation & usage documentation
└── .gitignore                        # Ignores data audio while preserving data/ folder
```
