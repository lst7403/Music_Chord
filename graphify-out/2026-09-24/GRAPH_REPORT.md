# Graph Report - Music_Chord  (2026-09-24)

## Corpus Check
- 15 files · ~32,530 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .ipynb 6, (none) 3, .css 1)

## Summary
- 267 nodes · 691 edges · 13 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63f803bd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.js
- editor.js
- transposeChordName
- app.py
- initUploadModal
- align_chords_to_beats
- alignment.js
- chord-library.js
- pipeline.py
- _run_core_pipeline
- Music Source Separation & Chord Recognition Web App
- run_youtube_pipeline_task
- download_youtube_audio

## God Nodes (most connected - your core abstractions)
1. `transposeChordName()` - 24 edges
2. `formatChordName()` - 22 edges
3. `setupEventListeners()` - 21 edges
4. `normalizeRoot()` - 21 edges
5. `initUploadModal()` - 20 edges
6. `_run_core_pipeline()` - 17 edges
7. `renderAllEditorComponents()` - 17 edges
8. `setupEditorEventListeners()` - 14 edges
9. `renderEditableMeasureTape()` - 14 edges
10. `showToast()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `upload_music()` --indirect_call--> `run_pipeline_task()`  [INFERRED]
  app.py → pipeline.py
- `pipeline_status()` --calls--> `get_pipeline_status()`  [EXTRACTED]
  app.py → pipeline.py
- `process_youtube()` --calls--> `get_pipeline_status()`  [EXTRACTED]
  app.py → pipeline.py
- `process_youtube()` --indirect_call--> `run_youtube_pipeline_task()`  [INFERRED]
  app.py → pipeline.py
- `reset_pipeline()` --calls--> `update_status()`  [EXTRACTED]
  app.py → pipeline.py

## Import Cycles
- None detected.

## Communities (13 total, 0 thin omitted)

### Community 0 - "main.js"
Cohesion: 0.12
Nodes (36): getAudioContext(), playMetronomeTick(), applyEditorTransposition(), editorState, applyTransposition(), centerActiveChordCard(), centerMeasureInSlidingTape(), el (+28 more)

### Community 1 - "editor.js"
Cohesion: 0.19
Nodes (34): applyEditorFilter(), applyPickedChord(), bindDomElements(), centerEditorChordCard(), centerEditorMeasureCard(), closeChordPicker(), deleteBar(), deleteBeat() (+26 more)

### Community 2 - "transposeChordName"
Cohesion: 0.20
Nodes (28): CHORD_ALTERNATIVES_DB, CHORD_INTERVALS, FLATS_TO_SHARPS, GUITAR_CHORDS_DB, PITCH_CLASSES, ROOT_COLORS, openChordPicker(), renderEditableChordStream() (+20 more)

### Community 3 - "app.py"
Cohesion: 0.09
Nodes (27): get_aligned_chords(), get_beats(), get_chords(), get_safe_data_path(), get_stems(), pipeline_status(), Path, Parse and return chord progression from data/chords.csv. (+19 more)

### Community 4 - "initUploadModal"
Cohesion: 0.25
Nodes (18): initUploadModal(), checkInitialStatus(), closeModal(), handleFileSelected(), handleFrontendYtSubmit(), handlePipelineStatus(), hideError(), isValidYouTubeUrl() (+10 more)

### Community 5 - "align_chords_to_beats"
Cohesion: 0.13
Nodes (20): Any, Reset pipeline state if it was in error., Save user-edited chords, beats, and measures to CSV files., Reset chords and beats back to the original AI generated versions., Upload new music file and trigger Demucs separation & chord recognition…, reset_edits(), reset_pipeline(), save_edits() (+12 more)

### Community 6 - "alignment.js"
Cohesion: 0.22
Nodes (16): alignedState, applyAlignmentCapo(), applyAlignmentTransposition(), centerMeasureInSlidingTape(), dom, filterMeasures(), highlightActiveBeatCell(), initAlignmentView() (+8 more)

### Community 7 - "chord-library.js"
Cohesion: 0.18
Nodes (15): OPEN_STRING_FREQS, playGuitarStrum(), playPluckedString(), applyFiltersAndRender(), currentFilters, generateLibraryFretboardSvg(), initChordLibrary(), navigateToChordInLibrary() (+7 more)

### Community 8 - "pipeline.py"
Cohesion: 0.14
Nodes (14): numpy, pandas, get_beat_model(), predict_beats(), Extract beats and downbeats from audio using BeatThis model. Returns a…, Load and cache the BeatThis model for beat and downbeat tracking., shutil, soundfile (+6 more)

### Community 9 - "_run_core_pipeline"
Cohesion: 0.15
Nodes (18): no_grad, combine_bass_and_other(), combine_instrumental(), get_btc_model(), predict_chords(), Path, Run Demucs source separation to produce vocals, drums, bass, other with real-…, Merge bass and other stems into harmonic accompaniment for chord estimation. (+10 more)

### Community 10 - "Music Source Separation & Chord Recognition Web App"
Cohesion: 0.17
Nodes (11): 🛠️ Environment Installation Guide, 🌐 How to Run the Chord Web App, Music Source Separation & Chord Recognition Web App, Option A: Using the Notebook Controller (Recommended), Option B: Using the Command Line, Prerequisites, 📂 Project Structure, Step 1: Create and Activate Conda Environment (+3 more)

### Community 11 - "run_youtube_pipeline_task"
Cohesion: 0.29
Nodes (7): process_youtube(), Download audio from YouTube and trigger Demucs separation & chord recognition…, YouTubeRequest, BaseModel, Background execution worker for downloading YouTube audio and running complete…, run_youtube_pipeline_task(), dl_progress()

### Community 12 - "download_youtube_audio"
Cohesion: 0.29
Nodes (6): convert_to_mp3(), download_youtube_audio(), get_ffmpeg_executable(), Download audio from a YouTube URL and convert to high-quality MP3., Find FFmpeg binary: check imageio-ffmpeg first, then fallback to system ffmpeg., Convert any audio file format to standardized MP3 using ffmpeg.

## Knowledge Gaps
- **22 isolated node(s):** `alignedState`, `dom`, `OPEN_STRING_FREQS`, `STRING_NAMES`, `OPEN_STRING_INDICES` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 73 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `initUploadModal()` connect `initUploadModal` to `main.js`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `formatChordName()` connect `transposeChordName` to `main.js`, `editor.js`, `alignment.js`, `chord-library.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `normalizeRoot()` connect `transposeChordName` to `main.js`, `editor.js`, `alignment.js`, `chord-library.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `initUploadModal()` (e.g. with `closeModal()` and `openModal()`) actually correct?**
  _`initUploadModal()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `alignedState`, `dom`, `OPEN_STRING_FREQS` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12010796221322537 - nodes in this community are weakly interconnected._
- **Should `app.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08994708994708994 - nodes in this community are weakly interconnected._