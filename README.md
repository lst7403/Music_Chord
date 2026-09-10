# Music Source Separation & Chord Recognition Web App

This repository contains a full pipeline and interactive web application for:
1. **Audio Source Separation** using **Demucs** (`htdemucs`) to separate tracks into individual stems (**Vocals**, **Drums**, **Bass**, **Other**) directly into `data/`.
2. **Audio Stem Combination** (`combine.ipynb`) to merge isolated stems (**Bass + Other**) into harmonic accompaniment (`data/bass_other.wav`).
3. **Musical Chord Recognition** using the **BTC (Bi-directional Transformer for Chord Recognition)** model (`puar-playground/btc-chord`) on harmonic accompaniment.
4. **Beat & Downbeat Tracking** (`beat.ipynb`) using the **`beat_this`** state-of-the-art transformer model to detect beat timestamps, measure downbeats, and estimate song tempo (BPM).
5. **Interactive FastAPI Web App** (`app.py`) for synchronized real-time chord visualization, interactive piano voicing, dynamic guitar chord fretboard diagrams, multi-stem audio switching, pitch transposition, and scrubbable timeline.

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
- **Comprehensive Chord Database**: Built-in library supporting 14 chord types across all 12 root pitch classes (Major, Minor, 7th, Maj7, Min7, Diminished, Augmented, Sus2, Sus4, etc.) with dynamic guitar fret fingerings, barres, and piano interval voicings.
- **Interactive Chord & Beat Editor (Edit Mode)**:
  - 📝 **Chord Picker & Harmony Edit**: Click any beat or progression card to modify chords using the interactive visual chord picker.
  - 🔀 **Drag-and-Drop & Gap Insertion**: Reorder beats and measures, insert beats at timeline gaps (`+`), or delete beats.
  - ⏱️ **BPM & Timing Adjustment**: Fine-tune tempo, downbeat anchors, and measure grouping with full Undo/Redo (`Ctrl+Z` / `Ctrl+Y`).
  - 💾 **Save & Reset**: Export user corrections back to CSV files (`/api/edit/save`) or revert anytime to original AI predictions.
- **Live Transposition**: Transpose the whole song key up/down by semitones in real-time (`-` / `+` / `Reset`).
- **Scrubbable Color Timeline**: Visual chord blocks positioned along the timeline; click anywhere to jump immediately to that point in the track.
- **Auto-Scrolling Progression Sheet**: Grid of chord cards with search/filter capabilities.

---

## 📂 Project Structure

```text
seperate/
├── data/                             # Model generated data
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
│   ├── separate.ipynb                # Step 1: Demucs source separation notebook
│   ├── combine.ipynb                 # Step 2: Audio stem combination notebook
│   ├── chord_recognition.ipynb       # Step 3: BTC chord recognition notebook
│   ├── beat.ipynb                    # Step 4: BeatThis beat & downbeat tracking notebook
│   └── align.ipynb                   # Step 5: Beat-synchronous chord alignment notebook
├── pipeline.py                       # Unified audio, chord & beat AI processing engine 
├── app.py                            # FastAPI backend server
```
