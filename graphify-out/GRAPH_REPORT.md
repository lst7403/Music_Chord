# Graph Report - Music_Chord  (2026-09-24)

## Corpus Check
- 15 files · ~32,764 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 264 nodes · 684 edges · 13 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63f803bd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.js
- editor.js
- upload_music
- app.py
- initUploadModal
- align_chords_to_beats
- alignment.js
- chord-library.js
- pipeline.py
- _run_core_pipeline
- Music Source Separation & Chord Recognition Web App
- run_youtube_pipeline_task
- predict_beats

## God Nodes (most connected - your core abstractions)
1. `transposeChordName()` - 24 edges
2. `formatChordName()` - 22 edges
3. `setupEventListeners()` - 21 edges
4. `normalizeRoot()` - 21 edges
5. `initUploadModal()` - 20 edges
6. `renderAllEditorComponents()` - 17 edges
7. `_run_core_pipeline()` - 15 edges
8. `setupEditorEventListeners()` - 14 edges
9. `renderEditableMeasureTape()` - 14 edges
10. `showToast()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `upload_music()` --indirect_call--> `run_pipeline_task()`  [INFERRED]
  app.py → pipeline.py
- `pipeline_status()` --calls--> `get_pipeline_status()`  [EXTRACTED]
  app.py → pipeline.py
- `upload_music()` --calls--> `get_pipeline_status()`  [EXTRACTED]
  app.py → pipeline.py
- `process_youtube()` --calls--> `get_pipeline_status()`  [EXTRACTED]
  app.py → pipeline.py
- `process_youtube()` --indirect_call--> `run_youtube_pipeline_task()`  [INFERRED]
  app.py → pipeline.py

## Import Cycles
- None detected.

## Communities (13 total, 0 thin omitted)

### Community 0 - "main.js"
Cohesion: 0.11
Nodes (39): getAudioContext(), playMetronomeTick(), applyEditorTransposition(), bindDomElements(), editorState, initEditorView(), loadEditorData(), applyTransposition() (+31 more)

### Community 1 - "editor.js"
Cohesion: 0.15
Nodes (46): applyEditorFilter(), applyPickedChord(), centerEditorChordCard(), centerEditorMeasureCard(), closeChordPicker(), deleteBar(), deleteBeat(), dom (+38 more)

### Community 2 - "upload_music"
Cohesion: 0.33
Nodes (6): get_safe_data_path(), Path, Ensure requested file resides strictly within DATA_DIR to prevent path…, Upload new music file and trigger Demucs separation & chord recognition…, upload_music(), UploadFile

### Community 3 - "app.py"
Cohesion: 0.10
Nodes (22): get_beats(), get_chords(), get_stems(), pipeline_status(), Parse and return chord progression from data/chords.csv., Parse and return beat and downbeat timestamps from data/beats.csv., List available audio stems in data directory., Stream audio files directly from the data folder. (+14 more)

### Community 4 - "initUploadModal"
Cohesion: 0.25
Nodes (18): initUploadModal(), checkInitialStatus(), closeModal(), handleFileSelected(), handleFrontendYtSubmit(), handlePipelineStatus(), hideError(), isValidYouTubeUrl() (+10 more)

### Community 5 - "align_chords_to_beats"
Cohesion: 0.16
Nodes (17): Any, get_aligned_chords(), Parse and return beat-aligned chord progression grouped by measures/bars., Save user-edited chords, beats, and measures to CSV files., Reset chords and beats back to the original AI generated versions., reset_edits(), save_edits(), DataFrame (+9 more)

### Community 6 - "alignment.js"
Cohesion: 0.22
Nodes (16): alignedState, applyAlignmentCapo(), applyAlignmentTransposition(), centerMeasureInSlidingTape(), dom, filterMeasures(), highlightActiveBeatCell(), initAlignmentView() (+8 more)

### Community 7 - "chord-library.js"
Cohesion: 0.12
Nodes (28): OPEN_STRING_FREQS, playGuitarStrum(), playPluckedString(), applyFiltersAndRender(), currentFilters, generateLibraryFretboardSvg(), initChordLibrary(), navigateToChordInLibrary() (+20 more)

### Community 8 - "pipeline.py"
Cohesion: 0.12
Nodes (17): numpy, os, pandas, convert_to_mp3(), download_youtube_audio(), DummyDispatcher, get_ffmpeg_executable(), Find FFmpeg binary: check imageio-ffmpeg first, then fallback to system ffmpeg. (+9 more)

### Community 9 - "_run_core_pipeline"
Cohesion: 0.18
Nodes (15): no_grad, combine_bass_and_other(), combine_instrumental(), get_btc_model(), predict_chords(), Path, Run Demucs source separation to produce vocals, drums, bass, other with real-…, Merge bass and other stems into harmonic accompaniment for chord estimation. (+7 more)

### Community 10 - "Music Source Separation & Chord Recognition Web App"
Cohesion: 0.17
Nodes (11): 🛠️ Environment Installation Guide, 🌐 How to Run the Chord Web App, Music Source Separation & Chord Recognition Web App, Option A: Using the Notebook Controller (Recommended), Option B: Using the Command Line, Prerequisites, 📂 Project Structure, Step 1: Create and Activate Conda Environment (+3 more)

### Community 11 - "run_youtube_pipeline_task"
Cohesion: 0.22
Nodes (9): process_youtube(), Download audio from YouTube and trigger Demucs separation & chord recognition…, Reset pipeline state if it was in error., reset_pipeline(), YouTubeRequest, BaseModel, Background execution worker for downloading YouTube audio and running complete…, run_youtube_pipeline_task() (+1 more)

### Community 12 - "predict_beats"
Cohesion: 0.50
Nodes (4): get_beat_model(), predict_beats(), Extract beats and downbeats from audio using BeatThis model. Returns a…, Load and cache the BeatThis model for beat and downbeat tracking.

## Knowledge Gaps
- **23 isolated node(s):** `DummyDispatcher`, `alignedState`, `dom`, `OPEN_STRING_FREQS`, `STRING_NAMES` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 72 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `initUploadModal()` connect `initUploadModal` to `main.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `formatChordName()` connect `editor.js` to `main.js`, `alignment.js`, `chord-library.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `normalizeRoot()` connect `editor.js` to `main.js`, `alignment.js`, `chord-library.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `initUploadModal()` (e.g. with `closeModal()` and `openModal()`) actually correct?**
  _`initUploadModal()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DummyDispatcher`, `alignedState`, `dom` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11265969802555169 - nodes in this community are weakly interconnected._
- **Should `app.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10144927536231885 - nodes in this community are weakly interconnected._