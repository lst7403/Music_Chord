import { ROOT_COLORS } from './constants.js';
import { normalizeRoot, transposeChordName, getChordNotes, formatChordName, findBestCapo, getChordAlternatives } from './music.js';
import { renderGuitarChord } from './guitar.js';
import { initPianoKeyboard, highlightPianoNotes } from './piano.js';
import {
  formatTime,
  formatTimePrecise,
  renderUnifiedTimeline,
  renderRollingMeasureTape,
  renderUpcomingChords,
  generateMiniGuitarSvg
} from './timeline.js';
import { initUploadModal } from './upload.js';
import { initChordLibrary, navigateToChordInLibrary } from './chord-library.js';
import { getAudioContext, playMetronomeTick } from './audio-synth.js';
import { initEditorView, loadEditorData, updateEditorPlayhead, applyEditorTransposition, editorState } from './editor.js';

// --- STATE ---
const state = {
  currentView: 'visualizer', // 'visualizer' | 'editor' | 'library'
  timelineView: 'stream',    // 'stream' | 'tape'
  audio: null,
  rawChords: [],
  activeChords: [],
  alignedMeasures: [],
  currentChordIndex: -1,
  currentMeasureNum: -1,
  currentBeatNum: -1,
  transposeSemitones: 0,
  playbackSpeed: 1.0,
  autoScroll: true,
  filterText: '',
  stems: [],
  currentStemUrl: '',
  totalDuration: 0,
  instrumentMode: 'guitar', // 'guitar', 'piano'
  capoFret: 0, // 0 to 7

  // Beat & Rhythm Tracking State
  rawBeats: [],
  downbeats: [],
  currentBeatIndex: -1,
  currentMeasure: 1,
  bpm: 0,
  metronomeEnabled: false,
};

// --- DOM ELEMENTS ---
const el = {};

function initDomReferences() {
  el.audio = document.getElementById('audio-player');
  state.audio = el.audio;

  el.navTabVisualizer = document.getElementById('nav-tab-visualizer');
  el.navTabEditor = document.getElementById('nav-tab-editor');
  el.navTabLibrary = document.getElementById('nav-tab-library');
  el.viewVisualizer = document.getElementById('view-visualizer');
  el.viewEditor = document.getElementById('view-editor');
  el.viewChordLibrary = document.getElementById('view-chord-library');
  el.btnJumpLibrary = document.getElementById('btn-jump-library');
  el.stemSelect = document.getElementById('stem-select');
  el.speedSelect = document.getElementById('speed-select');
  el.transposeVal = document.getElementById('transpose-val');
  el.btnTransposeUp = document.getElementById('transpose-up');
  el.btnTransposeDown = document.getElementById('transpose-down');
  el.btnTransposeReset = document.getElementById('transpose-reset');

  // Rhythm & Beat HUD Elements
  el.playerBeatArea = document.getElementById('player-beat-area');
  el.bpmDisplay = document.getElementById('bpm-display');
  el.beatDots = document.querySelectorAll('.beat-dot');
  el.measureNum = document.getElementById('measure-num');
  el.btnMetronome = document.getElementById('btn-metronome');
  el.heroBeatBadge = document.getElementById('hero-beat-badge');
  el.heroBeatText = document.getElementById('hero-beat-text');

  // Timeline Containers & Navigation
  el.unifiedTimelineWrapper = document.getElementById('unified-timeline-wrapper');
  el.unifiedTimelineContainer = document.getElementById('unified-timeline-container');
  el.slidingTapeViewport = document.getElementById('sliding-tape-viewport');
  el.slidingTapeTrack = document.getElementById('sliding-tape-track');
  el.timelineSearchInput = document.getElementById('timeline-search-input');
  el.tapeNavControls = document.getElementById('tape-nav-controls');
  el.tapeActiveBarBadge = document.getElementById('tape-active-bar-badge');
  el.btnTapePrevBar = document.getElementById('btn-tape-prev-bar');
  el.btnTapeNextBar = document.getElementById('btn-tape-next-bar');
  el.autoScrollToggle = document.getElementById('auto-scroll-toggle');
  el.modeBtns = document.querySelectorAll('.mode-toggle-group .btn');

  // Instrument Cards
  el.pianoCard = document.getElementById('piano-card');
  el.guitarCard = document.getElementById('guitar-card');
  el.guitarChordSvg = document.getElementById('guitar-chord-svg');
  el.guitarChordTitle = document.getElementById('guitar-chord-title');
  el.guitarSoundingTitle = document.getElementById('guitar-sounding-title');
  el.guitarStringNotes = document.getElementById('guitar-string-notes');
  el.guitarFingeringLabel = document.getElementById('guitar-fingering-label');
  el.capoSelect = document.getElementById('capo-select');
  el.btnSmartCapo = document.getElementById('btn-smart-capo');

  el.heroChordName = document.getElementById('hero-chord-name');
  el.heroChordDesc = document.getElementById('hero-chord-desc');
  el.chordTiming = document.getElementById('chord-timing');

  el.altTargetChord = document.getElementById('alt-target-chord');
  el.alternativesGrid = document.getElementById('alternatives-grid');

  el.notesLabel = document.getElementById('notes-label');
  el.pianoKeyboard = document.getElementById('piano-keyboard');

  // Player controls
  el.btnPlayPause = document.getElementById('btn-play-pause');
  el.btnPrevChord = document.getElementById('btn-prev-chord');
  el.btnNextChord = document.getElementById('btn-next-chord');
  el.audioScrubber = document.getElementById('audio-scrubber');
  el.scrubberFill = document.getElementById('scrubber-fill');
  el.timeCurrent = document.getElementById('time-current');
  el.timeTotal = document.getElementById('time-total');
  el.volumeSlider = document.getElementById('volume-slider');
  el.btnMute = document.getElementById('btn-mute');
}

// --- DATA FETCHING ---
async function fetchStems() {
  try {
    const res = await fetch('/api/stems');
    if (!res.ok) throw new Error('Failed to load stems');
    const data = await res.json();
    state.stems = data.stems || [];

    el.stemSelect.innerHTML = '';
    if (state.stems.length === 0) {
      el.stemSelect.innerHTML = '<option value="">No audio stems found in data/</option>';
      return;
    }

    // Default stem: Full Mix (music.mp3)
    const defaultStem = state.stems.find(s =>
      s.id === 'music' ||
      s.filename === 'music.mp3' ||
      (s.name && s.name.toLowerCase().includes('full mix')) ||
      (s.display && s.display.toLowerCase().includes('full mix'))
    ) || state.stems[0];

    state.stems.forEach(stem => {
      const opt = document.createElement('option');
      const stemId = stem.filename || stem.id || stem.name;
      opt.value = stemId;
      const displayName = stem.display || stem.name || stem.filename || 'Audio Track';
      const icon = stem.icon || '🎵';
      opt.textContent = `${icon} ${displayName}`;
      if (defaultStem && (stem.filename === defaultStem.filename || stem.id === defaultStem.id || stem.name === defaultStem.name)) {
        opt.selected = true;
      }
      el.stemSelect.appendChild(opt);
    });

    if (defaultStem) {
      setAudioSource(defaultStem.filename || defaultStem.id || defaultStem.name);
    }
  } catch (err) {
    console.error('Error fetching stems:', err);
    el.stemSelect.innerHTML = '<option value="">Error loading stems</option>';
  }
}

function setAudioSource(stemIdentifier) {
  const stem = state.stems.find(s =>
    s.filename === stemIdentifier ||
    s.id === stemIdentifier ||
    s.name === stemIdentifier ||
    s.url === stemIdentifier
  );
  if (!stem) return;

  const prevTime = el.audio.currentTime;
  const isPlaying = !el.audio.paused;

  state.currentStemUrl = stem.url;
  el.audio.src = stem.url;
  el.audio.playbackRate = state.playbackSpeed;

  el.audio.onloadedmetadata = () => {
    el.audio.currentTime = prevTime;
    state.totalDuration = el.audio.duration;
    if (el.timeTotal) el.timeTotal.textContent = formatTime(el.audio.duration);
    updateScrubberProgress(prevTime);
    if (isPlaying) {
      el.audio.play().catch(e => console.warn(e));
    }
  };
}

async function fetchChords() {
  try {
    const res = await fetch('/api/chords');
    if (!res.ok) throw new Error('Failed to load chords');
    const data = await res.json();
    state.rawChords = data.chords || [];
    applyTransposition();
  } catch (err) {
    console.error('Error fetching chords:', err);
    if (el.unifiedTimelineContainer) {
      el.unifiedTimelineContainer.innerHTML = `
        <div class="empty-state">
          ⚠️ Could not load <code>data/chords.csv</code>.<br>
          Please run <code>chord_recognition.ipynb</code> first to generate predictions!
        </div>
      `;
    }
  }
}

async function fetchBeats() {
  try {
    const res = await fetch('/api/beats');
    if (!res.ok) throw new Error('Failed to fetch beats');
    const data = await res.json();
    state.rawBeats = data.beats || [];
    state.bpm = data.bpm || 0;
    state.downbeats = (data.beats || []).filter(b => b.is_downbeat).map(b => b.time);

    if (el.bpmDisplay) {
      el.bpmDisplay.textContent = state.bpm ? `${state.bpm} BPM` : '-- BPM';
    }
  } catch (err) {
    console.warn('Error fetching beats:', err);
    if (el.bpmDisplay) el.bpmDisplay.textContent = '-- BPM';
  }
}

async function fetchAlignedChords() {
  try {
    const res = await fetch('/api/aligned-chords');
    if (!res.ok) throw new Error('Failed to fetch aligned chords');
    const data = await res.json();
    state.alignedMeasures = data.measures || [];
    if (data.bpm && !state.bpm) {
      state.bpm = data.bpm;
      if (el.bpmDisplay) el.bpmDisplay.textContent = `${state.bpm} BPM`;
    }

    renderTape();
  } catch (err) {
    console.warn('Error fetching aligned chords:', err);
    if (el.slidingTapeTrack) {
      el.slidingTapeTrack.innerHTML = `
        <div class="empty-state">
          ⚠️ Please run <code>align.ipynb</code> or process a song to load beat-aligned measures!
        </div>
      `;
    }
  }
}

function renderTape() {
  renderRollingMeasureTape(
    el.slidingTapeTrack,
    state.alignedMeasures,
    (time) => {
      el.audio.currentTime = time + 0.01;
      if (el.audio.paused) el.audio.play().catch(e => console.warn(e));
    },
    state.transposeSemitones,
    state.capoFret
  );

  filterTimeline();
}



function applyTransposition() {
  state.activeChords = state.rawChords.map(item => ({
    start: item.start,
    end: item.end,
    duration: item.duration,
    chord: transposeChordName(item.chord, state.transposeSemitones),
    originalChord: item.chord
  }));

  if (el.transposeVal) {
    el.transposeVal.textContent = state.transposeSemitones > 0 ? `+${state.transposeSemitones}` : state.transposeSemitones;
  }

  // Calculate and update Smart Capo recommendation across all smart capo buttons
  const smart = findBestCapo(state.activeChords);
  document.querySelectorAll('.btn-smart-capo').forEach(btn => {
    if (smart.bestCapo > 0) {
      btn.textContent = `✨ Best: Capo ${smart.bestCapo}`;
      btn.title = `Auto-apply optimal Capo ${smart.bestCapo} (${smart.openPercent}% open shapes)`;
      btn.dataset.recommended = smart.bestCapo;
      btn.classList.add('has-recommendation');
    } else {
      btn.textContent = `✨ Best: No Capo`;
      btn.title = `Optimal playability with No Capo (${smart.openPercent}% open shapes)`;
      btn.dataset.recommended = 0;
      btn.classList.remove('has-recommendation');
    }
  });

  // Sync all Capo dropdown values across the page (header, visualizer card, editor card)
  document.querySelectorAll('.capo-select').forEach(selectEl => {
    selectEl.value = state.capoFret.toString();
  });

  // 1. Re-render Continuous Chord Stream
  renderUnifiedTimeline(el.unifiedTimelineContainer, state.activeChords, (item, index) => {
    el.audio.currentTime = item.start + 0.01;
    if (el.audio.paused) el.audio.play().catch(e => console.warn(e));
  }, state.capoFret);

  // 2. Re-render Beat-Aligned Rolling Measure Tape
  renderTape();

  // 3. Sync Interactive Editor Transposition and Capo
  applyEditorTransposition(state.transposeSemitones, state.capoFret);

  updateActiveChord(el.audio.currentTime);
}

function filterTimeline() {
  const q = (state.filterText || '').toLowerCase().trim();

  // Filter Chord Stream
  if (el.unifiedTimelineContainer) {
    const cards = el.unifiedTimelineContainer.querySelectorAll('.timeline-chord-card');
    cards.forEach(card => {
      if (!q || card.dataset.chord.includes(q)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Filter Rolling Measure Tape
  if (el.slidingTapeTrack) {
    const tapeCards = el.slidingTapeTrack.querySelectorAll('.tape-measure-card');
    tapeCards.forEach(c => {
      if (!q) {
        c.style.opacity = '1';
        c.style.filter = 'none';
        return;
      }
      const mNum = c.dataset.measure;
      const chords = c.dataset.chords || '';
      if (mNum === q || chords.includes(q) || `bar ${mNum}`.includes(q)) {
        c.style.opacity = '1';
        c.style.filter = 'none';
      } else {
        c.style.opacity = '0.25';
        c.style.filter = 'grayscale(0.8)';
      }
    });
  }
}

function setInstrumentMode(mode) {
  state.instrumentMode = mode;
  el.modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (el.unifiedTimelineContainer) {
    el.unifiedTimelineContainer.dataset.timelineMode = mode;
  }
}

// --- REAL-TIME PLAYBACK & SYNCHRONIZATION ---
let playbackRafId = null;

function startPlaybackLoop() {
  if (playbackRafId) cancelAnimationFrame(playbackRafId);
  function loop() {
    if (!el.audio.paused) {
      updateActiveChord(el.audio.currentTime);
      playbackRafId = requestAnimationFrame(loop);
    }
  }
  playbackRafId = requestAnimationFrame(loop);
}

function stopPlaybackLoop() {
  if (playbackRafId) {
    cancelAnimationFrame(playbackRafId);
    playbackRafId = null;
  }
}

function updateScrubberProgress(currentTime) {
  const total = el.audio.duration || state.totalDuration || 0;
  const pct = total > 0 ? Math.min(100, Math.max(0, (currentTime / total) * 100)) : 0;
  if (el.audioScrubber) el.audioScrubber.value = pct;
  if (el.scrubberFill) el.scrubberFill.style.width = `${pct}%`;
  if (el.timeCurrent) el.timeCurrent.textContent = formatTime(currentTime);
  if (el.timeTotal && !isNaN(total) && total > 0) el.timeTotal.textContent = formatTime(total);
}

function updateActiveChord(currentTime) {
  // Always update audio scrubber and timers regardless of chords/beats
  updateScrubberProgress(currentTime);

  // 1. Synchronize Beat Tracker HUD
  updateActiveBeat(currentTime);

  // 2. Synchronize Beat-Aligned Measure Tape
  updateActiveMeasureStream(currentTime);

  // 4. Synchronize Interactive Editor if active
  if (editorState.active) {
    updateEditorPlayhead(currentTime);
  }

  // 3. Synchronize Continuous Chord Progression Stream
  if (!state.activeChords.length) return;

  let newIndex = -1;
  for (let i = 0; i < state.activeChords.length; i++) {
    const item = state.activeChords[i];
    if (currentTime >= item.start && currentTime < item.end) {
      newIndex = i;
      break;
    }
  }

  if (newIndex === -1 && currentTime >= state.activeChords[state.activeChords.length - 1].end) {
    newIndex = state.activeChords.length - 1;
  }

  if (newIndex !== state.currentChordIndex) {
    state.currentChordIndex = newIndex;
    onChordChanged(newIndex);
  }
}

function updateActiveMeasureStream(currentTime) {
  if (!state.alignedMeasures.length) return;

  let activeMeasureObj = null;
  for (let i = 0; i < state.alignedMeasures.length; i++) {
    const m = state.alignedMeasures[i];
    if (currentTime >= m.start && currentTime < m.end) {
      activeMeasureObj = m;
      break;
    }
  }

  if (!activeMeasureObj && currentTime >= state.alignedMeasures[state.alignedMeasures.length - 1].end) {
    activeMeasureObj = state.alignedMeasures[state.alignedMeasures.length - 1];
  }

  const activeMeasureNum = activeMeasureObj ? activeMeasureObj.measure : -1;

  if (activeMeasureNum !== state.currentMeasureNum && activeMeasureObj) {
    state.currentMeasureNum = activeMeasureNum;
    onMeasureChanged(activeMeasureObj);
  }

  // Highlight specific beat cell within measure tape
  if (activeMeasureObj) {
    let activeBeatNum = 1;
    for (let i = 0; i < (activeMeasureObj.beats || []).length; i++) {
      const b = activeMeasureObj.beats[i];
      if (currentTime >= b.time && (i === activeMeasureObj.beats.length - 1 || currentTime < activeMeasureObj.beats[i+1].time)) {
        activeBeatNum = b.beat;
        break;
      }
    }

    if (activeBeatNum !== state.currentBeatNum) {
      state.currentBeatNum = activeBeatNum;
      highlightActiveBeatCell(activeMeasureNum, activeBeatNum);
    }
  }
}

function onMeasureChanged(m) {
  if (!m) return;
  const capoBadge = state.capoFret > 0 ? ` (Capo ${state.capoFret})` : '';
  if (el.tapeActiveBarBadge) {
    el.tapeActiveBarBadge.textContent = `BAR ${m.measure}${capoBadge}`;
  }

  if (el.slidingTapeTrack) {
    const tapeCards = el.slidingTapeTrack.querySelectorAll('.tape-measure-card');
    tapeCards.forEach(c => c.classList.remove('active'));

    const activeTapeCard = document.getElementById(`tape-bar-${m.measure}`);
    if (activeTapeCard) {
      activeTapeCard.classList.add('active');
    }

    if (state.autoScroll) {
      centerMeasureInSlidingTape(m.measure, 'smooth');
    }
  }
}

function centerMeasureInSlidingTape(measureNum, behavior = 'smooth') {
  if (!el.slidingTapeViewport) return;
  const activeTapeCard = document.getElementById(`tape-bar-${measureNum}`);
  if (!activeTapeCard) return;

  const viewportWidth = el.slidingTapeViewport.clientWidth;
  const cardLeft = activeTapeCard.offsetLeft;
  const cardWidth = activeTapeCard.offsetWidth;

  const targetScrollLeft = cardLeft - (viewportWidth / 2) + (cardWidth / 2);

  el.slidingTapeViewport.scrollTo({
    left: Math.max(0, targetScrollLeft),
    behavior: behavior
  });
}

function highlightActiveBeatCell(measureNum, beatNum) {
  if (!el.slidingTapeTrack) return;
  const tapeCells = el.slidingTapeTrack.querySelectorAll('.tape-beat-cell');
  tapeCells.forEach(cell => cell.classList.remove('active-beat'));

  const activeTapeCell = document.getElementById(`tape-beat-${measureNum}-${beatNum}`);
  if (activeTapeCell) {
    activeTapeCell.classList.add('active-beat');
  }
}

function updateActiveBeat(currentTime) {
  if (!state.rawBeats.length) return;

  let beatIdx = -1;
  for (let i = 0; i < state.rawBeats.length; i++) {
    const b = state.rawBeats[i];
    const nextTime = i < state.rawBeats.length - 1 ? state.rawBeats[i+1].time : b.time + 0.6;
    if (currentTime >= b.time && currentTime < nextTime) {
      beatIdx = i;
      break;
    }
  }

  if (beatIdx === -1) {
    if (currentTime >= state.rawBeats[state.rawBeats.length - 1].time) {
      beatIdx = state.rawBeats.length - 1;
    } else {
      beatIdx = 0;
    }
  }

  const dots = el.beatDots || document.querySelectorAll('.beat-dot');

  if (beatIdx === state.currentBeatIndex) {
    return;
  }

  state.currentBeatIndex = beatIdx;

  if (beatIdx === -1 || !state.rawBeats[beatIdx]) {
    dots.forEach(d => d.classList.remove('active', 'downbeat'));
    if (el.measureNum) el.measureNum.textContent = '--';
    if (el.heroBeatText) el.heroBeatText.textContent = 'Beat --';
    return;
  }

  const beatObj = state.rawBeats[beatIdx];
  const beatNum = parseInt(beatObj.beat) || 1;
  const isDownbeat = Boolean(beatObj.is_downbeat);

  let measure = 1;
  if (state.downbeats && state.downbeats.length > 0) {
    measure = state.downbeats.filter(t => t <= beatObj.time + 0.001).length || 1;
  }
  state.currentMeasure = measure;

  if (el.measureNum) {
    el.measureNum.textContent = measure;
  }

  // Update 4-Beat LED Dots
  const dotIndex = ((beatNum - 1) % 4) + 1;
  dots.forEach(dot => {
    const dVal = parseInt(dot.dataset.beat);
    if (dVal === dotIndex) {
      dot.classList.add('active');
      if (isDownbeat) dot.classList.add('downbeat');
    } else {
      dot.classList.remove('active', 'downbeat');
    }
  });

  if (el.heroBeatText) {
    el.heroBeatText.textContent = isDownbeat ? `Beat ${beatNum} (Downbeat)` : `Beat ${beatNum}`;
  }

  if (el.heroBeatBadge) {
    el.heroBeatBadge.classList.remove('pulse-beat', 'pulse-downbeat');
    void el.heroBeatBadge.offsetWidth;
    el.heroBeatBadge.classList.add(isDownbeat ? 'pulse-downbeat' : 'pulse-beat');
  }

  if (state.metronomeEnabled && !el.audio.paused) {
    playMetronomeTick(isDownbeat);
  }
}

function onChordChanged(index) {
  if (el.unifiedTimelineContainer) {
    const allCards = el.unifiedTimelineContainer.querySelectorAll('.timeline-chord-card');
    allCards.forEach(c => c.classList.remove('active'));
  }

  if (index === -1 || !state.activeChords[index]) {
    document.documentElement.style.setProperty('--active-root-color', '#6366f1');
    document.documentElement.style.setProperty('--active-root-glow', 'rgba(99, 102, 241, 0.25)');
    if (el.heroChordName) el.heroChordName.textContent = '--';
    if (el.heroChordDesc) el.heroChordDesc.textContent = 'Audio Stopped / Paused';
    if (el.chordTiming) el.chordTiming.textContent = '0.0s – 0.0s';
    renderGuitarChord(el.guitarChordSvg, el.guitarChordTitle, el.guitarStringNotes, el.guitarFingeringLabel, 'N', state.capoFret, el.guitarSoundingTitle);
    highlightPianoNotes(el.pianoKeyboard, el.notesLabel, []);
    renderChordAlternatives('N', state.capoFret);
    return;
  }

  const activeItem = state.activeChords[index];
  const soundingChord = activeItem.chord;
  const effectiveGuitarChord = state.capoFret > 0 && soundingChord !== 'N'
    ? transposeChordName(soundingChord, -state.capoFret)
    : soundingChord;

  // Synesthetic root color for dynamic ambient UI glow
  const root = soundingChord === 'N' ? 'N' : normalizeRoot(soundingChord.split(':')[0]);
  const rootColor = ROOT_COLORS[root] || '#6366f1';
  document.documentElement.style.setProperty('--active-root-color', rootColor);
  document.documentElement.style.setProperty('--active-root-glow', `${rootColor}44`);

  if (el.heroChordName) {
    el.heroChordName.textContent = formatChordName(effectiveGuitarChord);
  }

  if (el.heroChordDesc) {
    if (state.capoFret > 0 && soundingChord !== 'N') {
      el.heroChordDesc.textContent = `Capo ${state.capoFret} Shape (Sounding: ${formatChordName(soundingChord)})`;
    } else {
      el.heroChordDesc.textContent = `Active Sounding Harmony: ${formatChordName(soundingChord)}`;
    }
  }

  if (el.chordTiming) {
    el.chordTiming.textContent = `${activeItem.start.toFixed(1)}s – ${activeItem.end.toFixed(1)}s (${activeItem.duration.toFixed(1)}s)`;
  }

  const chordNotes = getChordNotes(soundingChord);
  highlightPianoNotes(el.pianoKeyboard, el.notesLabel, chordNotes);
  renderGuitarChord(el.guitarChordSvg, el.guitarChordTitle, el.guitarStringNotes, el.guitarFingeringLabel, activeItem.chord, state.capoFret, el.guitarSoundingTitle);

  // Active Card & Auto-Scroll in Chord Stream
  centerActiveChordCard(index, 'smooth');

  // Render Alternative Voicings
  renderChordAlternatives(activeItem.chord, state.capoFret);
}

function centerActiveChordCard(index, behavior = 'smooth') {
  const activeCard = document.getElementById(`chord-card-${index}`);
  if (activeCard) {
    activeCard.classList.add('active');
    if (state.autoScroll && state.timelineView === 'stream' && el.unifiedTimelineContainer) {
      const container = el.unifiedTimelineContainer;
      const containerWidth = container.clientWidth;
      const cardLeft = activeCard.offsetLeft;
      const cardWidth = activeCard.clientWidth;
      const targetScrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: behavior
      });
    }
  }
}

function renderChordAlternatives(chordStr, capoFret = 0) {
  if (!el.alternativesGrid) return;

  if (!chordStr || chordStr === 'N') {
    if (el.altTargetChord) el.altTargetChord.textContent = '--';
    el.alternativesGrid.innerHTML = `<div class="empty-state">Play audio or click a chord to see alternative fingerings.</div>`;
    return;
  }

  const effectiveChord = capoFret > 0 ? transposeChordName(chordStr, -capoFret) : chordStr;
  const formattedName = formatChordName(effectiveChord);

  if (el.altTargetChord) {
    el.altTargetChord.textContent = formattedName + (capoFret > 0 ? ` (Capo ${capoFret})` : '');
  }

  const alts = getChordAlternatives(chordStr, capoFret);
  if (!alts || alts.length === 0) {
    el.alternativesGrid.innerHTML = `
      <div class="alt-chord-card alt-card-standard">
        <div class="alt-card-header">
          <div class="alt-chord-name">${formattedName}</div>
        </div>
        <div class="alt-visual-wrapper">
          ${generateMiniGuitarSvg(effectiveChord, '#38bdf8')}
        </div>
      </div>
    `;
    return;
  }

  el.alternativesGrid.innerHTML = '';
  const frag = document.createDocumentFragment();

  alts.forEach(alt => {
    const card = document.createElement('div');
    card.className = 'alt-chord-card';

    const tabStr = alt.frets.map(f => f === -1 ? 'x' : f.toString()).join('-');
    const miniSvg = generateMiniGuitarSvg(alt, '#38bdf8');

    card.innerHTML = `
      <div class="alt-card-header">
        <div class="alt-chord-name">${alt.name}</div>
      </div>
      <div class="alt-visual-wrapper">
        ${miniSvg}
      </div>
      <div class="alt-tab-row">
        <span class="alt-tab-label">Tab:</span>
        <span class="alt-tab-val">${tabStr}</span>
      </div>
      <button class="btn btn-sm btn-ghost btn-inspect-alt" title="Inspect this voicing on the main guitar fretboard">
        🔍 Preview Shape
      </button>
    `;

    card.addEventListener('click', () => {
      el.alternativesGrid.querySelectorAll('.alt-chord-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      renderGuitarChord(
        el.guitarChordSvg,
        el.guitarChordTitle,
        el.guitarStringNotes,
        el.guitarFingeringLabel,
        alt,
        state.capoFret,
        el.guitarSoundingTitle
      );
    });

    frag.appendChild(card);
  });

  el.alternativesGrid.appendChild(frag);
}

function jumpToAdjacentMeasure(delta) {
  if (!state.alignedMeasures.length) return;
  const curIdx = state.alignedMeasures.findIndex(m => m.measure === state.currentMeasureNum);
  const nextIdx = Math.max(0, Math.min(state.alignedMeasures.length - 1, (curIdx >= 0 ? curIdx : 0) + delta));
  const targetBar = state.alignedMeasures[nextIdx];
  if (targetBar) {
    el.audio.currentTime = targetBar.start + 0.01;
    if (el.audio.paused) el.audio.play().catch(() => {});
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  if (el.btnTimelineStream) {
    el.btnTimelineStream.addEventListener('click', () => switchTimelineView('stream'));
  }
  if (el.btnTimelineTape) {
    el.btnTimelineTape.addEventListener('click', () => switchTimelineView('tape'));
  }

  if (el.timelineSearchInput) {
    el.timelineSearchInput.addEventListener('input', (e) => {
      state.filterText = e.target.value;
      filterTimeline();
    });
  }

  if (el.btnTapePrevBar) {
    el.btnTapePrevBar.addEventListener('click', () => jumpToAdjacentMeasure(-1));
  }
  if (el.btnTapeNextBar) {
    el.btnTapeNextBar.addEventListener('click', () => jumpToAdjacentMeasure(1));
  }

  el.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => setInstrumentMode(btn.dataset.mode));
  });

  el.audio.addEventListener('timeupdate', () => updateActiveChord(el.audio.currentTime));
  el.audio.addEventListener('play', () => {
    if (el.btnPlayPause) el.btnPlayPause.textContent = '⏸';
    startPlaybackLoop();
  });
  el.audio.addEventListener('pause', () => {
    if (el.btnPlayPause) el.btnPlayPause.textContent = '▶';
    stopPlaybackLoop();
  });
  el.audio.addEventListener('ended', () => {
    if (el.btnPlayPause) el.btnPlayPause.textContent = '▶';
    stopPlaybackLoop();
  });
  el.audio.addEventListener('loadedmetadata', () => {
    if (el.timeTotal) el.timeTotal.textContent = formatTime(el.audio.duration);
  });

  if (el.btnPlayPause) {
    el.btnPlayPause.addEventListener('click', () => {
      getAudioContext();
      if (el.audio.paused) el.audio.play().catch(e => console.warn(e));
      else el.audio.pause();
    });
  }

  if (el.btnPrevChord) {
    el.btnPrevChord.addEventListener('click', () => {
      if (state.timelineView === 'tape') {
        jumpToAdjacentMeasure(-1);
      } else if (state.currentChordIndex > 0) {
        el.audio.currentTime = state.activeChords[state.currentChordIndex - 1].start + 0.01;
      }
    });
  }

  if (el.btnNextChord) {
    el.btnNextChord.addEventListener('click', () => {
      if (state.timelineView === 'tape') {
        jumpToAdjacentMeasure(1);
      } else if (state.currentChordIndex < state.activeChords.length - 1) {
        el.audio.currentTime = state.activeChords[state.currentChordIndex + 1].start + 0.01;
      }
    });
  }

  if (el.audioScrubber) {
    el.audioScrubber.addEventListener('input', (e) => {
      const total = el.audio.duration || state.totalDuration || 1;
      const targetTime = (parseFloat(e.target.value) / 100) * total;
      el.audio.currentTime = targetTime;
      updateScrubberProgress(targetTime);
    });
  }

  if (el.volumeSlider) {
    el.volumeSlider.addEventListener('input', (e) => {
      el.audio.volume = parseFloat(e.target.value);
      if (el.btnMute) el.btnMute.textContent = el.audio.volume === 0 ? '🔇' : '🔊';
    });
  }

  if (el.btnMute) {
    el.btnMute.addEventListener('click', () => {
      if (el.audio.volume > 0) {
        el.audio.volume = 0;
        if (el.volumeSlider) el.volumeSlider.value = 0;
        el.btnMute.textContent = '🔇';
      } else {
        el.audio.volume = 0.9;
        if (el.volumeSlider) el.volumeSlider.value = 0.9;
        el.btnMute.textContent = '🔊';
      }
    });
  }

  if (el.stemSelect) {
    el.stemSelect.addEventListener('change', (e) => setAudioSource(e.target.value));
  }

  if (el.btnTransposeUp) {
    el.btnTransposeUp.addEventListener('click', () => {
      if (state.transposeSemitones < 11) {
        state.transposeSemitones += 1;
        applyTransposition();
      }
    });
  }

  if (el.btnTransposeDown) {
    el.btnTransposeDown.addEventListener('click', () => {
      if (state.transposeSemitones > -11) {
        state.transposeSemitones -= 1;
        applyTransposition();
      }
    });
  }

  if (el.btnTransposeReset) {
    el.btnTransposeReset.addEventListener('click', () => {
      state.transposeSemitones = 0;
      applyTransposition();
    });
  }

  if (el.speedSelect) {
    el.speedSelect.addEventListener('change', (e) => {
      state.playbackSpeed = parseFloat(e.target.value) || 1.0;
      el.audio.playbackRate = state.playbackSpeed;
    });
  }

  if (el.autoScrollToggle) {
    el.autoScrollToggle.addEventListener('change', (e) => {
      state.autoScroll = e.target.checked;
    });
  }

  function setCapo(fret) {
    state.capoFret = fret;
    document.querySelectorAll('.capo-select').forEach(selectEl => {
      selectEl.value = fret.toString();
    });
    applyTransposition();
    onChordChanged(state.currentChordIndex);
  }

  document.querySelectorAll('.capo-select').forEach(selectEl => {
    selectEl.addEventListener('change', (e) => {
      setCapo(parseInt(e.target.value, 10) || 0);
    });
  });

  document.querySelectorAll('.btn-smart-capo').forEach(btn => {
    btn.addEventListener('click', () => {
      const smart = findBestCapo(state.activeChords);
      setCapo(smart.bestCapo);
    });
  });

  if (el.btnMetronome) {
    el.btnMetronome.addEventListener('click', () => {
      getAudioContext();
      state.metronomeEnabled = !state.metronomeEnabled;
      el.btnMetronome.classList.toggle('active', state.metronomeEnabled);
      el.btnMetronome.title = state.metronomeEnabled ? 'Metronome Audio Click: ON' : 'Metronome Audio Click: OFF';
      if (state.metronomeEnabled) {
        playMetronomeTick(true);
      }
    });
  }

  // Navigation View Tabs
  if (el.navTabVisualizer) {
    el.navTabVisualizer.addEventListener('click', () => switchView('visualizer'));
  }
  if (el.navTabEditor) {
    el.navTabEditor.addEventListener('click', () => switchView('editor'));
  }
  if (el.navTabLibrary) {
    el.navTabLibrary.addEventListener('click', () => switchView('library'));
  }
  if (el.btnJumpLibrary) {
    el.btnJumpLibrary.addEventListener('click', () => {
      let chordToOpen = 'C';
      if (state.currentChordIndex >= 0 && state.activeChords[state.currentChordIndex]) {
        chordToOpen = state.activeChords[state.currentChordIndex].chord;
      }
      switchView('library');
      navigateToChordInLibrary(chordToOpen);
    });
  }

  // Listen for edits saved to disk
  window.addEventListener('chords-updated-on-disk', async () => {
    try {
      await fetchChords();
      await fetchBeats();
      await fetchAlignedChords();
    } catch (e) {
      console.warn('Error refreshing chords:', e);
    }
  });

  // Smooth horizontal scroll with mouse wheel on both timeline containers
  if (el.unifiedTimelineContainer) {
    el.unifiedTimelineContainer.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.unifiedTimelineContainer.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  if (el.slidingTapeViewport) {
    el.slidingTapeViewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.slidingTapeViewport.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (el.btnPlayPause) el.btnPlayPause.click();
    } else if (e.code === 'ArrowLeft' || e.key === 'j') {
      if (state.timelineView === 'tape') jumpToAdjacentMeasure(-1);
      else el.audio.currentTime = Math.max(0, el.audio.currentTime - 5);
    } else if (e.code === 'ArrowRight' || e.key === 'l') {
      if (state.timelineView === 'tape') jumpToAdjacentMeasure(1);
      else el.audio.currentTime = Math.min(el.audio.duration || 9999, el.audio.currentTime + 5);
    } else if (e.key === 'm') {
      if (el.btnMute) el.btnMute.click();
    }
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  const isVis = viewName === 'visualizer';
  const isEdit = viewName === 'editor';
  const isLib = viewName === 'library';

  editorState.active = isEdit;

  if (el.navTabVisualizer) el.navTabVisualizer.classList.toggle('active', isVis);
  if (el.navTabEditor) el.navTabEditor.classList.toggle('active', isEdit);
  if (el.navTabLibrary) el.navTabLibrary.classList.toggle('active', isLib);

  if (el.viewVisualizer) el.viewVisualizer.style.display = isVis ? 'flex' : 'none';
  if (el.viewEditor) el.viewEditor.style.display = isEdit ? 'flex' : 'none';
  if (el.viewChordLibrary) el.viewChordLibrary.style.display = isLib ? 'block' : 'none';

  if (isEdit) {
    loadEditorData(state.alignedMeasures, state.activeChords, state.bpm);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- INITIALIZE ---
function init() {
  initDomReferences();
  initPianoKeyboard(el.pianoKeyboard);
  setInstrumentMode('guitar');
  setupEventListeners();
  initChordLibrary('chord-library-content');
  initEditorView(el.audio, state.alignedMeasures, state.activeChords, state.transposeSemitones, state.capoFret, state.bpm);
  initUploadModal({
    onProcessingComplete: async () => {
      try {
        await fetchStems();
        await fetchChords();
        await fetchBeats();
        await fetchAlignedChords();
        if (el.audio) {
          el.audio.play().catch(e => console.warn(e));
        }
      } catch (err) {
        console.error('Error refreshing post upload:', err);
      }
    }
  });

  fetchStems();
  fetchChords();
  fetchBeats();
  fetchAlignedChords().then(() => {
    if (editorState.active) {
      loadEditorData(state.alignedMeasures, state.rawChords);
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

