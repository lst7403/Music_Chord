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

// --- STATE ---
const state = {
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
};

// --- DOM ELEMENTS ---
const el = {
  audio: document.getElementById('audio-player'),
  stemSelect: document.getElementById('stem-select'),
  speedSelect: document.getElementById('speed-select'),
  transposeVal: document.getElementById('transpose-val'),
  btnTransposeUp: document.getElementById('transpose-up'),
  btnTransposeDown: document.getElementById('transpose-down'),
  btnTransposeReset: document.getElementById('transpose-reset'),

  modeBtns: document.querySelectorAll('.mode-toggle-group .btn'),
  pianoCard: document.getElementById('piano-card'),
  guitarCard: document.getElementById('guitar-card'),
  guitarChordSvg: document.getElementById('guitar-chord-svg'),
  guitarChordTitle: document.getElementById('guitar-chord-title'),
  guitarSoundingTitle: document.getElementById('guitar-sounding-title'),
  guitarTabText: document.getElementById('guitar-tab-text'),
  guitarFingeringLabel: document.getElementById('guitar-fingering-label'),
  capoSelect: document.getElementById('capo-select'),
  btnSmartCapo: document.getElementById('btn-smart-capo'),

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

function applyTransposition() {
  state.activeChords = state.rawChords.map(item => ({
    start: item.start,
    end: item.end,
    duration: item.duration,
    chord: transposeChordName(item.chord, state.transposeSemitones),
    originalChord: item.chord
  }));

  el.transposeVal.textContent = (state.transposeSemitones > 0 ? '+' : '') + state.transposeSemitones;

  // Calculate and update Smart Capo recommendation
  if (el.btnSmartCapo) {
    const smart = findBestCapo(state.activeChords);
    if (smart.bestCapo > 0) {
      el.btnSmartCapo.textContent = `✨ Best: Capo ${smart.bestCapo}`;
      el.btnSmartCapo.title = `Auto-apply optimal Capo ${smart.bestCapo} (${smart.openPercent}% open shapes)`;
      el.btnSmartCapo.dataset.recommended = smart.bestCapo;
      el.btnSmartCapo.classList.add('has-recommendation');
    } else {
      el.btnSmartCapo.textContent = `✨ Best: No Capo`;
      el.btnSmartCapo.title = `Optimal playability with No Capo (${smart.openPercent}% open shapes)`;
      el.btnSmartCapo.dataset.recommended = 0;
      el.btnSmartCapo.classList.remove('has-recommendation');
    }
  }

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
function updateActiveChord(currentTime) {
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

function onChordChanged(index) {
  const allCards = el.unifiedTimelineContainer.querySelectorAll('.timeline-chord-card');
  allCards.forEach(c => c.classList.remove('active'));

  if (index === -1 || !state.activeChords[index]) {
    el.heroChordName.textContent = '--';
    if (el.heroChordDesc) el.heroChordDesc.textContent = 'Audio Stopped / Paused';
    if (el.chordTiming) el.chordTiming.textContent = '0:00.00 / 0:00.00';
    highlightPianoNotes(el.pianoKeyboard, el.notesLabel, []);
    renderGuitarChord(el.guitarChordSvg, el.guitarChordTitle, el.guitarTabText, el.guitarFingeringLabel, 'N', state.capoFret, el.guitarSoundingTitle);
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
  renderGuitarChord(el.guitarChordSvg, el.guitarChordTitle, el.guitarTabText, el.guitarFingeringLabel, activeItem.chord, state.capoFret, el.guitarSoundingTitle);

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
        el.guitarTabText,
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
  el.audio.addEventListener('play', () => { el.btnPlayPause.textContent = '⏸'; });
  el.audio.addEventListener('pause', () => { el.btnPlayPause.textContent = '▶'; });
  el.audio.addEventListener('loadedmetadata', () => { el.timeTotal.textContent = formatTime(el.audio.duration); });

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

  el.speedSelect.addEventListener('change', (e) => {
    state.playbackSpeed = parseFloat(e.target.value);
    el.audio.playbackRate = state.playbackSpeed;
  });

  el.autoScrollToggle.addEventListener('change', (e) => {
    state.autoScroll = e.target.checked;
  });

  if (el.capoSelect) {
    el.capoSelect.addEventListener('change', (e) => {
      state.capoFret = parseInt(e.target.value, 10) || 0;
      applyTransposition();
      onChordChanged(state.currentChordIndex);
    });
  }

  if (el.btnSmartCapo) {
    el.btnSmartCapo.addEventListener('click', () => {
      const smart = findBestCapo(state.activeChords);
      state.capoFret = smart.bestCapo;
      if (el.capoSelect) el.capoSelect.value = smart.bestCapo.toString();
      applyTransposition();
      onChordChanged(state.currentChordIndex);
    });
  }

  // Smooth horizontal scroll with mouse wheel
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

// --- INITIALIZE ---
function init() {
  initPianoKeyboard(el.pianoKeyboard);
  setInstrumentMode('guitar');
  setupEventListeners();
  initUploadModal({
    onProcessingComplete: async () => {
      try {
        if (el.audio) {
          el.audio.pause();
          el.audio.currentTime = 0;
        }
        await fetchStems();
        await fetchChords();
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
}

document.addEventListener('DOMContentLoaded', init);
