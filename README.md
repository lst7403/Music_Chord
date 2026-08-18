# Music Source Separation & Chord Recognition Web App

This repository contains a full pipeline and interactive web application for:
1. **Audio Source Separation** using **Demucs** (`htdemucs`) to separate tracks into individual stems (**Vocals**, **Drums**, **Bass**, **Other**) directly into `data/`.
2. **Musical Chord Recognition** using the **BTC (Bi-directional Transformer for Chord Recognition)** model (`puar-playground/btc-chord`) on combined harmonic accompaniment (**Bass + Other**).
3. **Interactive FastAPI Web App** (`app.py`) for synchronized real-time chord visualization, interactive piano voicing, dynamic guitar chord fretboard diagrams, multi-stem audio switching, pitch transposition, and scrubbable timeline.
4. **Notebook Server Control** (`server.ipynb`) to start, monitor, and stop the web server directly inside a Jupyter notebook.

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

then install torch and torchaudio with your gpu cuda version

```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu130
pip install demucs
pip install ipykernel numpy soundfile librosa transformers huggingface_hub scipy pandas tqdm fastapi uvicorn python-multipart
```

---

## 🌐 How to Run the Chord Web App

### Option A: Using the Notebook Controller (Recommended)
Open [`server.ipynb`](./server.ipynb):
- Run **Cell 2 (`start_server()`)** to launch the server asynchronously in the background.
- Run **Cell 3 (`check_status()`)** to verify health and available stems.
- Run **Cell 4 (`stop_server()`)** to cleanly stop the server and free port 8000.

---

### Option B: Using the Command Line
```bash
python app.py
```
*(Or `uvicorn app:app --host 127.0.0.1 --port 8000`)*

Then open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## 🎸 Web App Features

- **Instrument Mode Switcher**:
  - 🎸 **Guitar Mode**: Dynamic SVG Guitar Chord Boxes showing 6 strings, frets, finger positions, and barres.
  - 🎹 **Piano Mode**: Interactive 2-octave keyboard lighting up chord notes (root, 3rd, 5th, 7th).
  - 🎼 **Both Mode**: View both instruments simultaneously.
- **Audio Stem Switcher**: Toggle between Full Mix (`music.mp3`), Accompaniment (`bass_other.wav`), Vocals, Drums, Bass, and Other.
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
│   ├── bass_other.wav                # Combined harmonic accompaniment
│   └── chords.csv                    # Chord timeline (CSV format)
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
├── app.py                            # FastAPI backend server
├── server.ipynb                      # Server controller notebook (start / check / stop)
├── separate.ipynb                    # Step 1: Demucs source separation notebook
├── chord_recognition.ipynb           # Step 2: BTC chord recognition notebook
├── README.md                         # Installation & usage documentation
└── .gitignore                        # Ignores data audio while preserving data/ folder
```
