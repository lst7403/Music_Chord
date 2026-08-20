import { ROOT_COLORS } from './constants.js';
import { normalizeRoot, transposeChordName, getChordNotes, formatChordName, findBestCapo, getChordAlternatives } from './music.js';
import { renderGuitarChord } from './guitar.js';
import { initPianoKeyboard, highlightPianoNotes } from './piano.js';
import {
  formatTime,
  formatTimePrecise,
  renderUnifiedTimeline,
  renderUpcomingChords,
  generateMiniGuitarSvg
} from './timeline.js';
import { initUploadModal } from './upload.js';
import { initChordLibrary, navigateToChordInLibrary } from './chord-library.js';
import { getAudioContext, playMetronomeTick } from './audio-synth.js';
import { initAlignmentView, updateAlignmentPlayhead, applyAlignmentTransposition, loadAlignedData } from './alignment.js';

// --- STATE ---
const state = {
  currentView: 'visualizer', // 'visualizer' | 'alignment' | 'library'
  audio: document.getElementById('audio-player'),
  rawChords: [],
  activeChords: [],
  currentChordIndex: -1,
  transposeSemitones: 0,
  playbackSpeed: 1.0,
  autoScroll: true,
  filterText: '',
  stems: [],
  currentStemUrl: '',
  totalDuration: 0,
  instrumentMode: 'both', // 'piano', 'guitar', 'both'
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
const el = {
  audio: document.getElementById('audio-player'),
  navTabVisualizer: document.getElementById('nav-tab-visualizer'),
  navTabAlignment: document.getElementById('nav-tab-alignment'),
  navTabLibrary: document.getElementById('nav-tab-library'),
  viewVisualizer: document.getElementById('view-visualizer'),
  viewAlignment: document.getElementById('view-alignment'),
  viewChordLibrary: document.getElementById('view-chord-library'),
  btnJumpLibrary: document.getElementById('btn-jump-library'),
  stemSelect: document.getElementById('stem-select'),
  speedSelect: document.getElementById('speed-select'),
  transposeVal: document.getElementById('transpose-val'),
  btnTransposeUp: document.getElementById('transpose-up'),
  btnTransposeDown: document.getElementById('transpose-down'),
  btnTransposeReset: document.getElementById('transpose-reset'),

  // Rhythm & Beat HUD Elements
  playerBeatArea: document.getElementById('player-beat-area'),
  bpmDisplay: document.getElementById('bpm-display'),
  beatDots: document.querySelectorAll('.beat-dot'),
  measureNum: document.getElementById('measure-num'),
  btnMetronome: document.getElementById('btn-metronome'),
  heroBeatBadge: document.getElementById('hero-beat-badge'),
  heroBeatText: document.getElementById('hero-beat-text'),

  modeBtns: document.querySelectorAll('.mode-toggle-group .btn'),
  pianoCard: document.getElementById('piano-card'),
  guitarCard: document.getElementById('guitar-card'),
  guitarChordSvg: document.getElementById('guitar-chord-svg'),
  guitarChordTitle: document.getElementById('guitar-chord-title'),
  guitarSoundingTitle: document.getElementById('guitar-sounding-title'),
  guitarStringNotes: document.getElementById('guitar-string-notes'),
  guitarFingeringLabel: document.getElementById('guitar-fingering-label'),
  capoSelect: document.getElementById('capo-select'),
  btnSmartCapo: document.getElementById('btn-smart-capo'),
  alignCapoSelect: document.getElementById('align-capo-select'),
  btnAlignSmartCapo: document.getElementById('btn-align-smart-capo'),

  heroChordName: document.getElementById('hero-chord-name'),
  heroChordDesc: document.getElementById('hero-chord-desc'),
  chordTiming: document.getElementById('chord-timing'),
  upcomingChordsContainer: document.getElementById('upcoming-chords-container'),

  altTargetChord: document.getElementById('alt-target-chord'),
  alternativesGrid: document.getElementById('alternatives-grid'),

  notesLabel: document.getElementById('notes-label'),
  pianoKeyboard: document.getElementById('piano-keyboard'),

  unifiedTimelineContainer: document.getElementById('unified-timeline-container'),
  autoScrollToggle: document.getElementById('auto-scroll-toggle'),

  btnPlayPause: document.getElementById('btn-play-pause'),
  btnPrevChord: document.getElementById('btn-prev-chord'),
  btnNextChord: document.getElementById('btn-next-chord'),
  audioScrubber: document.getElementById('audio-scrubber'),
  scrubberFill: document.getElementById('scrubber-fill'),
  timeCurrent: document.getElementById('time-current'),
  timeTotal: document.getElementById('time-total'),
  btnMute: document.getElementById('btn-mute'),
  volumeSlider: document.getElementById('volume-slider'),
};

// --- DATA FETCHING ---
async function fetchStems() {
  try {
    const res = await fetch('/api/stems');
    if (!res.ok) throw new Error('Failed to fetch stems');
    const data = await res.json();
    state.stems = data.stems || [];

    el.stemSelect.innerHTML = '';
    if (state.stems.length === 0) {
      el.stemSelect.innerHTML = '<option value="">No audio stems found in data/</option>';
      return;
    }

    state.stems.forEach(stem => {
      const opt = document.createElement('option');
      opt.value = stem.url;
      opt.textContent = `${stem.icon} ${stem.name} (${stem.size_mb} MB)`;
      el.stemSelect.appendChild(opt);
    });

    setAudioSource(state.stems[0].url);
  } catch (err) {
    console.error('Error fetching stems:', err);
    el.stemSelect.innerHTML = '<option value="/data/music.mp3">🎵 Full Mix (music.mp3)</option>';
    setAudioSource('/data/music.mp3');
  }
}

function setAudioSource(url) {
  if (!url) return;
  const wasPlaying = !el.audio.paused;
  const currentTime = el.audio.currentTime || 0;
  state.currentStemUrl = url;
  el.audio.src = url;
  el.audio.playbackRate = state.playbackSpeed;
  el.audio.currentTime = currentTime;
  if (wasPlaying) {
    el.audio.play().catch(e => console.warn('Audio play prevented:', e));
  }
}

async function fetchChords() {
  try {
    const res = await fetch('/api/chords');
    if (!res.ok) throw new Error('Failed to fetch chords');
    const data = await res.json();
    state.rawChords = data.chords || [];
    state.totalDuration = data.total_duration || 0;

    applyTransposition();
  } catch (err) {
    console.error('Error fetching chords:', err);
    el.unifiedTimelineContainer.innerHTML = `
      <div class="empty-state">
        ⚠️ Could not load <code>data/chords.csv</code>.<br>
        Please run <code>chord_recognition.ipynb</code> first to generate predictions!
      </div>
    `;
  }
}

async function fetchBeats() {
  try {
    const res = await fetch('/api/beats');
    if (!res.ok) throw new Error('Failed to fetch beats');
    const data = await res.json();
    state.rawBeats = data.beats || [];
    state.downbeats = data.downbeats || [];
    state.bpm = data.bpm || 0;

    if (el.bpmDisplay) {
      el.bpmDisplay.textContent = state.bpm ? `${state.bpm} BPM` : '-- BPM';
    }
  } catch (err) {
    console.warn('No beats available or error fetching beats:', err);
    if (el.bpmDisplay) el.bpmDisplay.textContent = '-- BPM';
  }
}

function applyTransposition() {
  state.activeChords = state.rawChords.map(item => ({
    start: item.start,
    end: item.end,
    duration: item.duration,
    chord: transposeChordName(item.chord, state.transposeSemitones),
    originalChord: item.chord
  }));

  el.transposeVal.textContent = state.transposeSemitones > 0 ? `+${state.transposeSemitones}` : state.transposeSemitones;

  // Calculate and update Smart Capo recommendation across both views
  const smart = findBestCapo(state.activeChords);
  const capoButtons = [el.btnSmartCapo, el.btnAlignSmartCapo].filter(Boolean);
  capoButtons.forEach(btn => {
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

  // Sync Capo dropdowns
  if (el.capoSelect) el.capoSelect.value = state.capoFret.toString();
  if (el.alignCapoSelect) el.alignCapoSelect.value = state.capoFret.toString();

  // Update alignment view lead sheet transposition and capo
  applyAlignmentTransposition(state.transposeSemitones, state.capoFret);

  renderUnifiedTimeline(el.unifiedTimelineContainer, state.activeChords, (item) => {
    el.audio.currentTime = item.start + 0.01;
    if (el.audio.paused) el.audio.play().catch(e => console.warn(e));
  }, state.capoFret);

  updateActiveChord(el.audio.currentTime);
}

function filterChordSheet(query) {
  state.filterText = (query || '').toLowerCase().trim();
  const cards = el.unifiedTimelineContainer.querySelectorAll('.timeline-chord-card');
  cards.forEach(card => {
    if (!state.filterText || card.dataset.chord.includes(state.filterText)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function setInstrumentMode(mode) {
  state.instrumentMode = mode;
  el.modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // Stage Grid always shows all detailed instruments (Hero Harmony + Guitar Chart + Piano Voicing)
  if (el.pianoCard) el.pianoCard.style.display = 'flex';
  if (el.guitarCard) el.guitarCard.style.display = 'flex';

  // Timeline mode switcher controls which mini chord instruction is shown inside timeline-chord-card
  if (el.unifiedTimelineContainer) {
    el.unifiedTimelineContainer.dataset.timelineMode = mode;
  }
}

// --- SYNCHRONIZATION & PLAYHEAD ---
let playbackRafId = null;

function startPlaybackLoop() {
  stopPlaybackLoop();
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

function updateActiveChord(currentTime) {
  // Synchronize Beat Tracker
  updateActiveBeat(currentTime);

  // Synchronize Beat-Chord Alignment Lead Sheet
  updateAlignmentPlayhead(currentTime);

  if (!state.activeChords.length) return;

  let newIndex = -1;
  for (let i = 0; i < state.activeChords.length; i++) {
    if (currentTime >= state.activeChords[i].start && currentTime < state.activeChords[i].end) {
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

  const total = el.audio.duration || state.totalDuration || 1;
  const progressPct = Math.min(100, Math.max(0, (currentTime / total) * 100));

  el.scrubberFill.style.width = `${progressPct}%`;
  el.audioScrubber.value = progressPct;

  el.timeCurrent.textContent = formatTime(currentTime);
  el.timeTotal.textContent = formatTime(total);
}

function updateActiveBeat(currentTime) {
  if (!state.rawBeats.length) return;

  let low = 0;
  let high = state.rawBeats.length - 1;
  let newBeatIndex = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const bTime = state.rawBeats[mid].time;
    if (bTime <= currentTime + 0.05) {
      newBeatIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (newBeatIndex !== state.currentBeatIndex) {
    state.currentBeatIndex = newBeatIndex;
    onBeatChanged(newBeatIndex);
  }
}

function onBeatChanged(beatIdx) {
  const dots = el.beatDots && el.beatDots.length ? el.beatDots : document.querySelectorAll('.beat-dot');

  if (beatIdx === -1 || !state.rawBeats[beatIdx]) {
    dots.forEach(dot => dot.classList.remove('active', 'downbeat'));
    if (el.measureNum) el.measureNum.textContent = '--';
    if (el.heroBeatText) el.heroBeatText.textContent = 'Beat --';
    if (el.heroBeatBadge) el.heroBeatBadge.classList.remove('pulse-beat', 'pulse-downbeat');
    return;
  }

  const beatObj = state.rawBeats[beatIdx];
  const beatNum = parseInt(beatObj.beat) || 1;
  const isDownbeat = Boolean(beatObj.is_downbeat);

  // Measure calculation: count how many downbeats up to this point
  let measure = 1;
  if (state.downbeats && state.downbeats.length > 0) {
    measure = state.downbeats.filter(t => t <= beatObj.time + 0.001).length || 1;
  }
  state.currentMeasure = measure;

  // Update HUD Measure number
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
      else dot.classList.remove('downbeat');
    } else {
      dot.classList.remove('active', 'downbeat');
    }
  });

  // Update Hero Card Beat Badge
  if (el.heroBeatText) {
    el.heroBeatText.textContent = isDownbeat ? `Bar ${measure} • Beat ${beatNum} (Downbeat)` : `Bar ${measure} • Beat ${beatNum}`;
  }

  if (el.heroBeatBadge) {
    el.heroBeatBadge.classList.remove('pulse-beat', 'pulse-downbeat');
    void el.heroBeatBadge.offsetWidth; // trigger CSS reflow for animation restart
    el.heroBeatBadge.classList.add(isDownbeat ? 'pulse-downbeat' : 'pulse-beat');
  }

  // Play crisp acoustic metronome click if enabled
  if (state.metronomeEnabled && !el.audio.paused) {
    playMetronomeTick(isDownbeat);
  }
}

function onChordChanged(index) {
  const allCards = el.unifiedTimelineContainer.querySelectorAll('.timeline-chord-card');
  allCards.forEach(c => c.classList.remove('active'));

  if (index === -1 || !state.activeChords[index]) {
    el.heroChordName.textContent = '--';
    if (el.heroChordDesc) el.heroChordDesc.textContent = 'Audio Stopped / Paused';
    if (el.chordTiming) el.chordTiming.textContent = '0:00.00 / 0:00.00';
    highlightPianoNotes(el.pianoKeyboard, el.notesLabel, []);
    renderGuitarChord(el.guitarChordSvg, el.guitarChordTitle, el.guitarStringNotes, el.guitarFingeringLabel, 'N', state.capoFret, el.guitarSoundingTitle);
    if (el.upcomingChordsContainer) renderUpcomingChords(el.upcomingChordsContainer, []);
    renderChordAlternatives('N', state.capoFret);
    return;
  }

  const activeItem = state.activeChords[index];
  el.heroChordName.textContent = formatChordName(activeItem.chord);
  if (el.heroChordDesc) el.heroChordDesc.textContent = activeItem.chord === 'N' ? 'No Chord / Silence' : `Duration: ${activeItem.duration.toFixed(2)}s`;
  if (el.chordTiming) el.chordTiming.textContent = `${formatTimePrecise(activeItem.start)} - ${formatTimePrecise(activeItem.end)}`;

  const root = activeItem.chord === 'N' ? 'N' : normalizeRoot(activeItem.chord.split(':')[0]);
  el.heroChordName.style.color = ROOT_COLORS[root] || '#ffffff';

  // Update Instruments
  const chordNotes = getChordNotes(activeItem.chord);
  highlightPianoNotes(el.pianoKeyboard, el.notesLabel, chordNotes);
  renderGuitarChord(el.guitarChordSvg, el.guitarChordTitle, el.guitarStringNotes, el.guitarFingeringLabel, activeItem.chord, state.capoFret, el.guitarSoundingTitle);

  // Active Card & Auto-Shift in Single Row
  const activeCard = document.getElementById(`chord-card-${index}`);
  if (activeCard) {
    activeCard.classList.add('active');
    if (state.autoScroll && el.unifiedTimelineContainer) {
      const container = el.unifiedTimelineContainer;
      const containerWidth = container.clientWidth;
      const cardLeft = activeCard.offsetLeft;
      const cardWidth = activeCard.clientWidth;
      const targetScrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      });
    }
  }

  // Upcoming Chords (if container present)
  if (el.upcomingChordsContainer) {
    const upcoming = state.activeChords.slice(index + 1, index + 5);
    renderUpcomingChords(el.upcomingChordsContainer, upcoming, state.capoFret);
  }

  // Update Alternative & Easier Chord Voicings
  renderChordAlternatives(activeItem.chord, state.capoFret);
}

// --- ALTERNATIVE & EASIER VOICINGS RENDERER ---
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
      // Highlight active selection
      el.alternativesGrid.querySelectorAll('.alt-chord-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      // Preview on main chart
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

// --- EVENT LISTENERS ---
function setupEventListeners() {
  el.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => setInstrumentMode(btn.dataset.mode));
  });

  el.audio.addEventListener('timeupdate', () => updateActiveChord(el.audio.currentTime));
  el.audio.addEventListener('play', () => {
    el.btnPlayPause.textContent = '⏸';
    startPlaybackLoop();
  });
  el.audio.addEventListener('pause', () => {
    el.btnPlayPause.textContent = '▶';
    stopPlaybackLoop();
  });
  el.audio.addEventListener('ended', () => {
    el.btnPlayPause.textContent = '▶';
    stopPlaybackLoop();
  });
  el.audio.addEventListener('loadedmetadata', () => {
    el.timeTotal.textContent = formatTime(el.audio.duration);
  });

  el.btnPlayPause.addEventListener('click', () => {
    if (el.audio.paused) el.audio.play().catch(e => console.warn(e));
    else el.audio.pause();
  });

  el.btnPrevChord.addEventListener('click', () => {
    if (state.currentChordIndex > 0) {
      el.audio.currentTime = state.activeChords[state.currentChordIndex - 1].start + 0.01;
    }
  });

  el.btnNextChord.addEventListener('click', () => {
    if (state.currentChordIndex < state.activeChords.length - 1) {
      el.audio.currentTime = state.activeChords[state.currentChordIndex + 1].start + 0.01;
    }
  });

  el.audioScrubber.addEventListener('input', (e) => {
    const total = el.audio.duration || state.totalDuration || 1;
    el.audio.currentTime = (parseFloat(e.target.value) / 100) * total;
  });

  el.volumeSlider.addEventListener('input', (e) => {
    el.audio.volume = parseFloat(e.target.value);
    el.btnMute.textContent = el.audio.volume === 0 ? '🔇' : '🔊';
  });

  el.btnMute.addEventListener('click', () => {
    if (el.audio.volume > 0) {
      el.audio.volume = 0;
      el.volumeSlider.value = 0;
      el.btnMute.textContent = '🔇';
    } else {
      el.audio.volume = 0.9;
      el.volumeSlider.value = 0.9;
      el.btnMute.textContent = '🔊';
    }
  });

  el.stemSelect.addEventListener('change', (e) => setAudioSource(e.target.value));

  el.btnTransposeUp.addEventListener('click', () => {
    if (state.transposeSemitones < 11) {
      state.transposeSemitones += 1;
      applyTransposition();
    }
  });

  el.btnTransposeDown.addEventListener('click', () => {
    if (state.transposeSemitones > -11) {
      state.transposeSemitones -= 1;
      applyTransposition();
    }
  });

  el.btnTransposeReset.addEventListener('click', () => {
    state.transposeSemitones = 0;
    applyTransposition();
  });

  if (el.btnMetronome) {
    el.btnMetronome.addEventListener('click', () => {
      // Ensure Web Audio Context is active on user gesture
      getAudioContext();

      state.metronomeEnabled = !state.metronomeEnabled;
      el.btnMetronome.classList.toggle('active', state.metronomeEnabled);
      el.btnMetronome.title = state.metronomeEnabled ? 'Metronome Audio Click: ON' : 'Metronome Audio Click: OFF';

      // Play immediate audible preview click when turned ON
      if (state.metronomeEnabled) {
        playMetronomeTick(true);
      }
    });
  }

  el.speedSelect.addEventListener('change', (e) => {
    state.playbackSpeed = parseFloat(e.target.value);
    el.audio.playbackRate = state.playbackSpeed;
  });

  el.autoScrollToggle.addEventListener('change', (e) => {
    state.autoScroll = e.target.checked;
  });

  function setCapo(fret) {
    state.capoFret = fret;
    if (el.capoSelect) el.capoSelect.value = fret.toString();
    if (el.alignCapoSelect) el.alignCapoSelect.value = fret.toString();
    applyTransposition();
    onChordChanged(state.currentChordIndex);
  }

  if (el.capoSelect) {
    el.capoSelect.addEventListener('change', (e) => {
      setCapo(parseInt(e.target.value, 10) || 0);
    });
  }

  if (el.alignCapoSelect) {
    el.alignCapoSelect.addEventListener('change', (e) => {
      setCapo(parseInt(e.target.value, 10) || 0);
    });
  }

  function applySmartCapo() {
    const smart = findBestCapo(state.activeChords);
    setCapo(smart.bestCapo);
  }

  if (el.btnSmartCapo) {
    el.btnSmartCapo.addEventListener('click', applySmartCapo);
  }
  if (el.btnAlignSmartCapo) {
    el.btnAlignSmartCapo.addEventListener('click', applySmartCapo);
  }

  // Smooth horizontal scroll with mouse wheel
  // Navigation View Tabs (Visualizer vs Beat-Chord Alignment vs Guitar Chord Library)
  if (el.navTabVisualizer) {
    el.navTabVisualizer.addEventListener('click', () => switchView('visualizer'));
  }
  if (el.navTabAlignment) {
    el.navTabAlignment.addEventListener('click', () => switchView('alignment'));
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

  if (el.unifiedTimelineContainer) {
    el.unifiedTimelineContainer.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.unifiedTimelineContainer.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      el.btnPlayPause.click();
    } else if (e.code === 'ArrowLeft' || e.key === 'j') {
      el.audio.currentTime = Math.max(0, el.audio.currentTime - 5);
    } else if (e.code === 'ArrowRight' || e.key === 'l') {
      el.audio.currentTime = Math.min(el.audio.duration || 9999, el.audio.currentTime + 5);
    } else if (e.key === 'm') {
      el.btnMute.click();
    }
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  const isVis = viewName === 'visualizer';
  const isAlign = viewName === 'alignment';
  const isLib = viewName === 'library';

  if (el.navTabVisualizer) el.navTabVisualizer.classList.toggle('active', isVis);
  if (el.navTabAlignment) el.navTabAlignment.classList.toggle('active', isAlign);
  if (el.navTabLibrary) el.navTabLibrary.classList.toggle('active', isLib);

  if (el.viewVisualizer) el.viewVisualizer.style.display = isVis ? 'flex' : 'none';
  if (el.viewAlignment) el.viewAlignment.style.display = isAlign ? 'flex' : 'none';
  if (el.viewChordLibrary) el.viewChordLibrary.style.display = isLib ? 'block' : 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- INITIALIZE ---
function init() {
  initPianoKeyboard(el.pianoKeyboard);
  setInstrumentMode('guitar');
  setupEventListeners();
  initChordLibrary('chord-library-content');
  initAlignmentView(el.audio);
  initUploadModal({
    onProcessingComplete: async () => {
      try {
        if (el.audio) {
          el.audio.pause();
          el.audio.currentTime = 0;
        }
        await fetchStems();
        await fetchChords();
        await fetchBeats();
        await loadAlignedData();
        if (el.audio) {
          el.audio.play().catch(e => console.warn(e));
        }
      } catch (err) {
        console.error('Error reloading after AI processing:', err);
      }
    }
  });
  fetchStems();
  fetchChords();
  fetchBeats();
}

document.addEventListener('DOMContentLoaded', init);
