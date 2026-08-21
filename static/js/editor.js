import { ROOT_COLORS } from './constants.js';
import { normalizeRoot, formatChordName, transposeChordName, getChordNotes } from './music.js';
import { generateMiniGuitarSvg } from './timeline.js';
import { renderGuitarChord } from './guitar.js';
import { initPianoKeyboard, highlightPianoNotes } from './piano.js';

// --- EDITOR STATE ---
export const editorState = {
  active: false,
  measures: [],
  chords: [],
  history: [],
  redoStack: [],
  audioPlayer: null,
  instrumentMode: 'guitar',
  transposeSemitones: 0,
  capoFret: 0,
  autoScroll: true,
  currentMeasure: -1,
  currentBeat: -1,
  currentChordIndex: -1,
  bpm: 120,
  filterText: '',
  dragItem: null, // { type: 'beat' | 'bar', barIdx: number, beatIdx?: number }
  pickerTarget: null // { barIdx, beatIdx, chord, isWholeBar }
};

// DOM references
let dom = {
  viewEditor: null,
  tapeViewport: null,
  tapeTrack: null,
  chordStreamWrapper: null,
  chordStreamContainer: null,
  btnSave: null,
  btnUndo: null,
  btnRedo: null,
  btnReset: null,
  btnPrevBar: null,
  btnNextBar: null,
  activeBarBadge: null,
  searchInput: null,
  bpmInput: null,
  btnBpmDec: null,
  btnBpmInc: null,
  btnBpmTap: null,
  btnBpmRescale: null,
  autoScrollToggle: null,
  modeGuitar: null,
  modePiano: null,

  // Synchronized Hero & Stage
  heroChordName: null,
  heroChordDesc: null,
  heroBeatBadge: null,
  heroBeatText: null,
  btnQuickEditCurrent: null,
  guitarChordSvg: null,
  guitarChordTitle: null,
  guitarSoundingTitle: null,
  guitarStringNotes: null,
  guitarFingeringLabel: null,
  pianoKeyboard: null,
  notesLabel: null,

  // Chord Picker Modal
  pickerModal: null,
  pickerTitle: null,
  pickerSubtitle: null,
  pickerSelectedChord: null,
  pickerSoundingChord: null,
  pickerPreviewLabel: null,
  pickerMiniPreview: null,
  pickerRootsGrid: null,
  pickerQualitiesGrid: null,
  pickerCustomInput: null,
  pickerApplyWholeBar: null,
  btnApplyPicker: null,
  btnCancelPicker: null,
  btnClosePicker: null
};

export function initEditorView(audioEl, initialMeasures, initialChords, currentTrans = 0, currentCapo = 0, initialBpm = 120) {
  editorState.audioPlayer = audioEl;
  editorState.transposeSemitones = currentTrans;
  editorState.capoFret = currentCapo;
  if (initialBpm) editorState.bpm = Math.round(initialBpm);

  bindDomElements();
  if (dom.pianoKeyboard) {
    initPianoKeyboard(dom.pianoKeyboard);
  }
  setupEditorEventListeners();

  if (initialMeasures && initialMeasures.length) {
    loadEditorData(initialMeasures, initialChords, initialBpm);
  }
}

function bindDomElements() {
  dom.viewEditor = document.getElementById('view-editor');
  dom.tapeViewport = document.getElementById('editor-sliding-tape-viewport');
  dom.tapeTrack = document.getElementById('editor-sliding-tape-track');
  dom.chordStreamWrapper = document.getElementById('editor-unified-timeline-wrapper');
  dom.chordStreamContainer = document.getElementById('editor-unified-timeline-container');
  dom.btnSave = document.getElementById('btn-editor-save');
  dom.btnUndo = document.getElementById('btn-editor-undo');
  dom.btnRedo = document.getElementById('btn-editor-redo');
  dom.btnReset = document.getElementById('btn-editor-reset');
  dom.btnPrevBar = document.getElementById('btn-editor-prev-bar');
  dom.btnNextBar = document.getElementById('btn-editor-next-bar');
  dom.activeBarBadge = document.getElementById('editor-tape-active-bar-badge');
  dom.searchInput = document.getElementById('editor-timeline-search');
  dom.bpmInput = document.getElementById('editor-bpm-input');
  dom.btnBpmDec = document.getElementById('btn-editor-bpm-dec');
  dom.btnBpmInc = document.getElementById('btn-editor-bpm-inc');
  dom.btnBpmTap = document.getElementById('btn-editor-bpm-tap');
  dom.btnBpmRescale = document.getElementById('btn-editor-bpm-rescale');
  dom.autoScrollToggle = document.getElementById('editor-auto-scroll-toggle');
  dom.modeGuitar = document.getElementById('editor-mode-guitar');
  dom.modePiano = document.getElementById('editor-mode-piano');

  dom.heroChordName = document.getElementById('editor-hero-chord-name');
  dom.heroChordDesc = document.getElementById('editor-hero-chord-desc');
  dom.heroBeatBadge = document.getElementById('editor-hero-beat-badge');
  dom.heroBeatText = document.getElementById('editor-hero-beat-text');
  dom.btnQuickEditCurrent = document.getElementById('btn-quick-edit-current');
  dom.guitarChordSvg = document.getElementById('editor-guitar-chord-svg');
  dom.guitarChordTitle = document.getElementById('editor-guitar-chord-title');
  dom.guitarSoundingTitle = document.getElementById('editor-guitar-sounding-title');
  dom.guitarStringNotes = document.getElementById('editor-guitar-string-notes');
  dom.guitarFingeringLabel = document.getElementById('editor-guitar-fingering-label');
  dom.pianoKeyboard = document.getElementById('editor-piano-keyboard');
  dom.notesLabel = document.getElementById('editor-notes-label');

  dom.pickerModal = document.getElementById('chord-picker-modal');
  dom.pickerTitle = document.getElementById('chord-picker-title');
  dom.pickerSubtitle = document.getElementById('chord-picker-subtitle');
  dom.pickerSelectedChord = document.getElementById('picker-selected-chord');
  dom.pickerSoundingChord = document.getElementById('picker-sounding-chord');
  dom.pickerPreviewLabel = document.getElementById('picker-preview-label');
  dom.pickerMiniPreview = document.getElementById('picker-mini-preview');
  dom.pickerRootsGrid = document.getElementById('picker-roots-grid');
  dom.pickerQualitiesGrid = document.getElementById('picker-qualities-grid');
  dom.pickerCustomInput = document.getElementById('picker-custom-input');
  dom.pickerApplyWholeBar = document.getElementById('picker-apply-whole-bar');
  dom.btnApplyPicker = document.getElementById('btn-apply-chord-picker');
  dom.btnCancelPicker = document.getElementById('btn-cancel-chord-picker');
  dom.btnClosePicker = document.getElementById('btn-close-chord-picker');
}

export function loadEditorData(measures, chords, bpm = 120) {
  editorState.measures = JSON.parse(JSON.stringify(measures || []));
  editorState.chords = JSON.parse(JSON.stringify(chords || []));
  if (bpm) editorState.bpm = Math.round(bpm);
  if (dom.bpmInput) dom.bpmInput.value = editorState.bpm;
  editorState.history = [];
  editorState.redoStack = [];
  updateUndoRedoButtons();
  renderAllEditorComponents();
}

function pushHistoryState(actionLabel = 'Edit') {
  if (editorState.history.length >= 30) {
    editorState.history.shift();
  }
  editorState.history.push({
    label: actionLabel,
    measures: JSON.parse(JSON.stringify(editorState.measures)),
    chords: JSON.parse(JSON.stringify(editorState.chords)),
    bpm: editorState.bpm
  });
  editorState.redoStack = [];
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  if (dom.btnUndo) dom.btnUndo.disabled = editorState.history.length === 0;
  if (dom.btnRedo) dom.btnRedo.disabled = editorState.redoStack.length === 0;
}

export function undo() {
  if (!editorState.history.length) return;
  const currentSnapshot = {
    measures: JSON.parse(JSON.stringify(editorState.measures)),
    chords: JSON.parse(JSON.stringify(editorState.chords)),
    bpm: editorState.bpm
  };
  editorState.redoStack.push(currentSnapshot);
  const previousState = editorState.history.pop();
  editorState.measures = previousState.measures;
  editorState.chords = previousState.chords;
  if (previousState.bpm) {
    editorState.bpm = previousState.bpm;
    if (dom.bpmInput) dom.bpmInput.value = editorState.bpm;
  }
  updateUndoRedoButtons();
  renderAllEditorComponents();
  showToast(`↩ Undid: ${previousState.label}`);
}

export function redo() {
  if (!editorState.redoStack.length) return;
  const currentSnapshot = {
    measures: JSON.parse(JSON.stringify(editorState.measures)),
    chords: JSON.parse(JSON.stringify(editorState.chords)),
    bpm: editorState.bpm
  };
  editorState.history.push(currentSnapshot);
  const nextState = editorState.redoStack.pop();
  editorState.measures = nextState.measures;
  editorState.chords = nextState.chords;
  if (nextState.bpm) {
    editorState.bpm = nextState.bpm;
    if (dom.bpmInput) dom.bpmInput.value = editorState.bpm;
  }
  updateUndoRedoButtons();
  renderAllEditorComponents();
  showToast('↪ Redid edit');
}

export function setEditorBpm(newBpm) {
  const bpm = Math.max(30, Math.min(300, Math.round(newBpm)));
  editorState.bpm = bpm;
  if (dom.bpmInput) dom.bpmInput.value = bpm;
  const bpmDisplay = document.getElementById('bpm-display');
  if (bpmDisplay) bpmDisplay.textContent = `${bpm} BPM`;
}

export function rescaleBeatGridToBpm(newBpm) {
  if (!editorState.measures.length || !newBpm || newBpm <= 0) return;
  pushHistoryState(`Rescale Grid to ${newBpm} BPM`);

  const targetBeatDur = 60.0 / newBpm;
  let currentStart = editorState.measures[0].start || 0;

  editorState.measures.forEach(m => {
    const numBeats = (m.beats && m.beats.length) ? m.beats.length : 4;
    const barDur = numBeats * targetBeatDur;
    m.start = round3(currentStart);
    m.end = round3(currentStart + barDur);
    (m.beats || []).forEach((b, bIdx) => {
      b.time = round3(m.start + bIdx * targetBeatDur);
    });
    currentStart = m.end;
  });

  recalculateMeasureNumbersAndTimeline();
  renderAllEditorComponents();
  showToast(`⚡ Rescaled beat grid to ${newBpm} BPM (${targetBeatDur.toFixed(2)}s/beat)`);
}

function setupEditorEventListeners() {
  // Undo / Redo
  if (dom.btnUndo) dom.btnUndo.addEventListener('click', undo);
  if (dom.btnRedo) dom.btnRedo.addEventListener('click', redo);

  // Save
  if (dom.btnSave) dom.btnSave.addEventListener('click', saveEditsToDisk);

  // Reset to AI
  if (dom.btnReset) dom.btnReset.addEventListener('click', resetEditsToAI);

  // Search
  if (dom.searchInput) {
    dom.searchInput.addEventListener('input', (e) => {
      editorState.filterText = (e.target.value || '').toLowerCase().trim();
      applyEditorFilter();
    });
  }

  // BPM Input & Controls
  if (dom.bpmInput) {
    dom.bpmInput.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) setEditorBpm(val);
    });
  }
  if (dom.btnBpmDec) {
    dom.btnBpmDec.addEventListener('click', () => {
      setEditorBpm(editorState.bpm - 1);
    });
  }
  if (dom.btnBpmInc) {
    dom.btnBpmInc.addEventListener('click', () => {
      setEditorBpm(editorState.bpm + 1);
    });
  }

  // Tap Tempo
  let tapTimestamps = [];
  if (dom.btnBpmTap) {
    dom.btnBpmTap.addEventListener('click', () => {
      const now = performance.now();
      if (tapTimestamps.length > 0 && now - tapTimestamps[tapTimestamps.length - 1] > 2500) {
        tapTimestamps = [];
      }
      tapTimestamps.push(now);
      if (tapTimestamps.length > 6) tapTimestamps.shift();

      dom.btnBpmTap.classList.add('tapped');
      setTimeout(() => dom.btnBpmTap.classList.remove('tapped'), 150);

      if (tapTimestamps.length >= 2) {
        const intervals = [];
        for (let i = 1; i < tapTimestamps.length; i++) {
          intervals.push(tapTimestamps[i] - tapTimestamps[i - 1]);
        }
        const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgMs);
        setEditorBpm(calculatedBpm);
        showToast(`🥁 Tap Tempo: ${calculatedBpm} BPM`);
      }
    });
  }

  // Rescale Grid Button
  if (dom.btnBpmRescale) {
    dom.btnBpmRescale.addEventListener('click', () => {
      rescaleBeatGridToBpm(editorState.bpm);
    });
  }

  // Prev / Next bar
  if (dom.btnPrevBar) dom.btnPrevBar.addEventListener('click', () => jumpEditorBar(-1));
  if (dom.btnNextBar) dom.btnNextBar.addEventListener('click', () => jumpEditorBar(1));

  // Auto scroll
  if (dom.autoScrollToggle) {
    dom.autoScrollToggle.addEventListener('change', (e) => {
      editorState.autoScroll = e.target.checked;
    });
  }

  // Horizontal X-Axis Scrolling on Mouse Wheel / Trackpad
  const attachHorizontalWheel = (scrollEl) => {
    if (!scrollEl) return;
    scrollEl.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > 0 || Math.abs(e.deltaX) > 0) {
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (delta !== 0) {
          e.preventDefault();
          scrollEl.scrollLeft += delta;
        }
      }
    }, { passive: false });
  };

  attachHorizontalWheel(dom.tapeViewport);
  attachHorizontalWheel(dom.chordStreamWrapper);
  attachHorizontalWheel(dom.chordStreamContainer);

  // Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
  window.addEventListener('keydown', (e) => {
    if (editorState.active) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveEditsToDisk();
      }
    }
  });

  // Mode Toggles (Guitar / Piano)
  if (dom.modeGuitar && dom.modePiano) {
    dom.modeGuitar.addEventListener('click', () => {
      editorState.instrumentMode = 'guitar';
      dom.modeGuitar.classList.add('active');
      dom.modePiano.classList.remove('active');
      renderAllEditorComponents();
    });
    dom.modePiano.addEventListener('click', () => {
      editorState.instrumentMode = 'piano';
      dom.modePiano.classList.add('active');
      dom.modeGuitar.classList.remove('active');
      renderAllEditorComponents();
    });
  }

  if (dom.btnQuickEditCurrent) {
    dom.btnQuickEditCurrent.addEventListener('click', () => {
      const curM = editorState.measures.find(m => m.measure === editorState.currentMeasure);
      if (curM && curM.beats && curM.beats.length) {
        const bIdx = Math.max(0, curM.beats.findIndex(b => b.beat === editorState.currentBeat));
        const barIdx = editorState.measures.indexOf(curM);
        openChordPicker(barIdx, bIdx >= 0 ? bIdx : 0);
      }
    });
  }

  setupChordPickerModal();
}

function jumpEditorBar(delta) {
  if (!editorState.measures.length) return;
  const curIdx = editorState.measures.findIndex(m => m.measure === editorState.currentMeasure);
  const nextIdx = Math.max(0, Math.min(editorState.measures.length - 1, (curIdx >= 0 ? curIdx : 0) + delta));
  const targetBar = editorState.measures[nextIdx];
  if (targetBar && editorState.audioPlayer) {
    editorState.audioPlayer.currentTime = targetBar.start + 0.01;
  }
}

// --- RENDERING EDITABLE TIMELINES ---
export function applyEditorTransposition(semitones, capoFret) {
  editorState.transposeSemitones = semitones;
  editorState.capoFret = capoFret;
  if (dom.activeBarBadge && editorState.currentMeasure > 0) {
    const capoBadge = editorState.capoFret > 0 ? ` (Capo ${editorState.capoFret})` : '';
    dom.activeBarBadge.textContent = `BAR ${editorState.currentMeasure}${capoBadge}`;
  }
  renderAllEditorComponents();
}

export function renderAllEditorComponents() {
  renderEditableMeasureTape();
  renderEditableChordStream();
  syncCurrentHeroChord();
}

function renderEditableMeasureTape() {
  if (!dom.tapeTrack) return;
  dom.tapeTrack.innerHTML = '';

  if (!editorState.measures || !editorState.measures.length) {
    dom.tapeTrack.innerHTML = '<div class="empty-state">No measures available.</div>';
    return;
  }

  const frag = document.createDocumentFragment();

  editorState.measures.forEach((m, barIdx) => {
    // 1. GAP INSERTER BETWEEN MEASURES (BEFORE BAR)
    const barGap = document.createElement('div');
    barGap.className = 'bar-gap-inserter';
    barGap.dataset.barIdx = barIdx;
    barGap.innerHTML = `
      <div class="gap-line"></div>
      <div class="gap-badge" title="Insert New Bar Here">+ BAR</div>
    `;
    barGap.addEventListener('click', (e) => {
      e.stopPropagation();
      insertBarAt(barIdx);
    });
    frag.appendChild(barGap);

    // 2. MEASURE CARD
    const tapeCard = document.createElement('div');
    tapeCard.className = 'tape-measure-card editor-measure-card';
    tapeCard.id = `editor-tape-bar-${m.measure}`;
    tapeCard.dataset.measure = m.measure;
    tapeCard.dataset.barIdx = barIdx;
    tapeCard.draggable = true;

    const beatCount = (m.beats && m.beats.length) ? m.beats.length : 4;
    tapeCard.style.minWidth = `${Math.max(220, beatCount * 96 + 32)}px`;

    // Measure Header with Drag Handle, Bar Number, and Delete Bar Button
    const cardHeader = document.createElement('div');
    cardHeader.className = 'tape-card-header editor-bar-header';
    cardHeader.innerHTML = `
      <div class="tape-bar-num-wrap" title="Click to seek audio to this bar">
        <span class="bar-drag-handle" title="Drag to reorder measure">⠿</span>
        <span class="tape-bar-num">BAR ${m.measure}</span>
        <span class="tape-bar-time">${m.start.toFixed(1)}s – ${m.end.toFixed(1)}s</span>
      </div>
      <div class="bar-header-actions">
        <button class="btn-delete-bar" title="Delete entire Bar ${m.measure}" data-bar-idx="${barIdx}">🗑️</button>
      </div>
    `;

    // Delete bar handler
    cardHeader.querySelector('.btn-delete-bar').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBar(barIdx);
    });

    // Seek audio on clicking bar header
    cardHeader.querySelector('.tape-bar-num-wrap').addEventListener('click', (e) => {
      e.stopPropagation();
      if (editorState.audioPlayer) {
        editorState.audioPlayer.currentTime = m.start + 0.001;
      }
    });

    // Beats Row with inside beat gap inserters
    const beatsRow = document.createElement('div');
    beatsRow.className = 'tape-beats-row editor-beats-row';
    beatsRow.style.display = 'flex';
    beatsRow.style.alignItems = 'stretch';
    beatsRow.style.gap = '3px';

    (m.beats || []).forEach((b, beatIdx) => {
      // GAP INSERTER BETWEEN BEATS (BEFORE BEAT)
      if (beatIdx > 0) {
        const beatGap = document.createElement('div');
        beatGap.className = 'beat-gap-inserter';
        beatGap.dataset.barIdx = barIdx;
        beatGap.dataset.beatIdx = beatIdx;
        beatGap.innerHTML = `
          <div class="gap-line"></div>
          <div class="gap-badge" title="Insert Beat Here">+</div>
        `;
        beatGap.addEventListener('click', (e) => {
          e.stopPropagation();
          insertBeatAt(barIdx, beatIdx);
        });
        beatsRow.appendChild(beatGap);
      }

      // BEAT CELL
      const soundingChord = transposeChordName(b.chord, editorState.transposeSemitones);
      const effectiveChord = (editorState.capoFret > 0 && soundingChord !== 'N')
        ? transposeChordName(soundingChord, -editorState.capoFret)
        : soundingChord;

      const isRest = effectiveChord === 'N';
      const root = isRest ? 'N' : normalizeRoot(effectiveChord.split(':')[0]);
      const rootColor = ROOT_COLORS[root] || '#6366f1';
      const displayName = isRest ? '—' : formatChordName(effectiveChord);
      const miniGuitar = generateMiniGuitarSvg(effectiveChord, rootColor);

      const cell = document.createElement('div');
      cell.className = `tape-beat-cell editor-beat-cell ${b.is_downbeat ? 'downbeat-cell' : ''}`;
      cell.id = `editor-tape-beat-${m.measure}-${b.beat}`;
      cell.dataset.barIdx = barIdx;
      cell.dataset.beatIdx = beatIdx;
      cell.dataset.time = b.time;
      cell.dataset.chord = b.chord;
      cell.draggable = true;
      cell.style.flex = '1';
      cell.style.minWidth = '120px';

      cell.innerHTML = `
        <div class="tape-beat-top" style="background: ${isRest ? 'rgba(255,255,255,0.06)' : rootColor}">
          <span class="tape-beat-tag">B${b.beat} ${b.is_downbeat ? '★' : ''}</span>
          <span class="tape-beat-time">${b.time.toFixed(1)}s</span>
          <button class="btn-delete-beat" title="Delete this beat" data-bar-idx="${barIdx}" data-beat-idx="${beatIdx}">✕</button>
        </div>
        <div class="tape-beat-chord" style="color: ${isRest ? '#94a3b8' : '#ffffff'}">${displayName}</div>
        <div class="tape-mini-chart">${miniGuitar}</div>
        <div class="beat-edit-hint">✏️ Edit</div>
      `;

      // Delete single beat
      cell.querySelector('.btn-delete-beat').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBeat(barIdx, beatIdx);
      });

      // Click on beat cell or edit badge opens Chord Picker
      const onCellClick = (e) => {
        e.stopPropagation();
        if (editorState.audioPlayer) {
          editorState.audioPlayer.currentTime = b.time + 0.01;
        }
        openChordPicker(barIdx, beatIdx);
      };

      cell.addEventListener('click', onCellClick);
      const hintBtn = cell.querySelector('.beat-edit-hint');
      if (hintBtn) {
        hintBtn.addEventListener('click', onCellClick);
      }

      // Drag events on beat cell
      setupBeatDragEvents(cell, barIdx, beatIdx);

      beatsRow.appendChild(cell);
    });

    // Final gap inside bar (after last beat)
    if (m.beats && m.beats.length > 0) {
      const finalBeatGap = document.createElement('div');
      finalBeatGap.className = 'beat-gap-inserter';
      finalBeatGap.dataset.barIdx = barIdx;
      finalBeatGap.dataset.beatIdx = m.beats.length;
      finalBeatGap.innerHTML = `
        <div class="gap-line"></div>
        <div class="gap-badge" title="Insert Beat at End of Bar">+</div>
      `;
      finalBeatGap.addEventListener('click', (e) => {
        e.stopPropagation();
        insertBeatAt(barIdx, m.beats.length);
      });
      beatsRow.appendChild(finalBeatGap);
    }

    tapeCard.appendChild(cardHeader);
    tapeCard.appendChild(beatsRow);

    // Setup Bar Drag events
    setupBarDragEvents(tapeCard, barIdx);

    frag.appendChild(tapeCard);
  });

  // Final gap after all measures
  const finalBarGap = document.createElement('div');
  finalBarGap.className = 'bar-gap-inserter';
  finalBarGap.dataset.barIdx = editorState.measures.length;
  finalBarGap.innerHTML = `
    <div class="gap-line"></div>
    <div class="gap-badge" title="Add Measure at End">+ BAR</div>
  `;
  finalBarGap.addEventListener('click', (e) => {
    e.stopPropagation();
    insertBarAt(editorState.measures.length);
  });
  frag.appendChild(finalBarGap);

  dom.tapeTrack.appendChild(frag);
  applyEditorFilter();
}

function renderEditableChordStream() {
  if (!dom.chordStreamContainer) return;
  dom.chordStreamContainer.innerHTML = '';

  if (!editorState.chords || !editorState.chords.length) {
    dom.chordStreamContainer.innerHTML = '<div class="empty-state">No chord segments.</div>';
    return;
  }

  const frag = document.createDocumentFragment();

  editorState.chords.forEach((item, cIdx) => {
    const effectiveChord = editorState.capoFret > 0 && item.chord !== 'N'
      ? transposeChordName(item.chord, -editorState.capoFret)
      : item.chord;

    const root = effectiveChord === 'N' ? 'N' : normalizeRoot(effectiveChord.split(':')[0]);
    const rootColor = ROOT_COLORS[root] || '#6366f1';
    const displayName = formatChordName(effectiveChord);
    const miniGuitarHtml = generateMiniGuitarSvg(effectiveChord, rootColor);

    const card = document.createElement('div');
    card.className = 'timeline-chord-card editor-chord-card';
    card.id = `editor-chord-card-${cIdx}`;
    card.dataset.index = cIdx;
    card.dataset.start = item.start;
    card.dataset.end = item.end;
    card.dataset.chord = effectiveChord.toLowerCase();

    card.innerHTML = `
      <div class="chord-top-bar" style="background: ${rootColor}"></div>
      <div class="card-chord-name" style="color: ${effectiveChord === 'N' ? '#94a3b8' : '#ffffff'}">${displayName}</div>
      <div class="card-timing-tag" style="font-size: 9.5px; font-family: var(--font-mono); color: #94a3b8; text-align: center; margin: 1px 0 3px 0;">${item.start.toFixed(1)}s – ${item.end.toFixed(1)}s (${item.duration.toFixed(1)}s)</div>
      <div class="card-visual-container">
        <div class="card-mini-guitar">${miniGuitarHtml}</div>
      </div>
      <div class="chord-stream-edit-hint">✏️ Edit</div>
    `;

    const onChordCardClick = (e) => {
      e.stopPropagation();
      if (editorState.audioPlayer) {
        editorState.audioPlayer.currentTime = item.start + 0.01;
      }
      // Find corresponding measure and beat to edit
      let matchedBarIdx = 0;
      let matchedBeatIdx = 0;
      for (let bi = 0; bi < editorState.measures.length; bi++) {
        const m = editorState.measures[bi];
        if (m.start <= item.start && m.end >= item.start) {
          matchedBarIdx = bi;
          matchedBeatIdx = Math.max(0, m.beats.findIndex(b => b.time >= item.start));
          break;
        }
      }
      openChordPicker(matchedBarIdx, matchedBeatIdx, item.chord, cIdx);
    };

    card.addEventListener('click', onChordCardClick);
    const hintBadge = card.querySelector('.chord-stream-edit-hint');
    if (hintBadge) {
      hintBadge.addEventListener('click', onChordCardClick);
    }

    frag.appendChild(card);
  });

  dom.chordStreamContainer.appendChild(frag);
  applyEditorFilter();
}

// --- DRAG AND DROP HANDLERS ---
function setupBeatDragEvents(cell, barIdx, beatIdx) {
  cell.addEventListener('dragstart', (e) => {
    e.stopPropagation();
    editorState.dragItem = { type: 'beat', barIdx, beatIdx };
    cell.classList.add('dragging');
    e.dataTransfer.setData('text/plain', JSON.stringify(editorState.dragItem));
    e.dataTransfer.effectAllowed = 'move';
  });

  cell.addEventListener('dragend', (e) => {
    e.stopPropagation();
    cell.classList.remove('dragging');
    document.querySelectorAll('.drag-over-beat').forEach(el => el.classList.remove('drag-over-beat'));
  });

  cell.addEventListener('dragover', (e) => {
    if (editorState.dragItem && editorState.dragItem.type === 'beat') {
      e.preventDefault();
      e.stopPropagation();
      cell.classList.add('drag-over-beat');
      e.dataTransfer.dropEffect = 'move';
    }
  });

  cell.addEventListener('dragleave', () => {
    cell.classList.remove('drag-over-beat');
  });

  cell.addEventListener('drop', (e) => {
    if (editorState.dragItem && editorState.dragItem.type === 'beat') {
      e.preventDefault();
      e.stopPropagation();
      cell.classList.remove('drag-over-beat');
      const fromBar = editorState.dragItem.barIdx;
      const fromBeat = editorState.dragItem.beatIdx;
      if (fromBar !== barIdx || fromBeat !== beatIdx) {
        moveBeat(fromBar, fromBeat, barIdx, beatIdx);
      }
    }
  });
}

function setupBarDragEvents(card, barIdx) {
  card.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('editor-beat-cell')) return;
    editorState.dragItem = { type: 'bar', barIdx };
    card.classList.add('dragging-bar');
    e.dataTransfer.setData('text/plain', JSON.stringify(editorState.dragItem));
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging-bar');
    document.querySelectorAll('.drag-over-bar').forEach(el => el.classList.remove('drag-over-bar'));
  });

  card.addEventListener('dragover', (e) => {
    if (editorState.dragItem && editorState.dragItem.type === 'bar') {
      e.preventDefault();
      card.classList.add('drag-over-bar');
      e.dataTransfer.dropEffect = 'move';
    }
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over-bar');
  });

  card.addEventListener('drop', (e) => {
    if (editorState.dragItem && editorState.dragItem.type === 'bar') {
      e.preventDefault();
      card.classList.remove('drag-over-bar');
      const fromBar = editorState.dragItem.barIdx;
      if (fromBar !== barIdx) {
        moveBar(fromBar, barIdx);
      }
    }
  });
}

// --- EDITING OPERATIONS ---
export function deleteBeat(barIdx, beatIdx) {
  pushHistoryState(`Delete Beat ${beatIdx + 1} in Bar ${barIdx + 1}`);
  const m = editorState.measures[barIdx];
  if (!m || !m.beats) return;

  m.beats.splice(beatIdx, 1);
  // If measure became empty, remove measure or add default beat
  if (m.beats.length === 0) {
    editorState.measures.splice(barIdx, 1);
  }

  recalculateMeasureNumbersAndTimeline();
  renderAllEditorComponents();
  showToast('✓ Beat deleted');
}

export function deleteBar(barIdx) {
  if (editorState.measures.length <= 1) {
    showToast('⚠️ Cannot delete the only remaining measure');
    return;
  }
  pushHistoryState(`Delete Bar ${barIdx + 1}`);
  editorState.measures.splice(barIdx, 1);
  recalculateMeasureNumbersAndTimeline();
  renderAllEditorComponents();
  showToast('✓ Measure deleted');
}

export function insertBeatAt(barIdx, beatIdx) {
  pushHistoryState(`Insert Beat in Bar ${barIdx + 1}`);
  const m = editorState.measures[barIdx];
  if (!m) return;

  let newTime = m.start;
  let copiedChord = 'N';

  if (m.beats && m.beats.length > 0) {
    if (beatIdx === 0) {
      newTime = Math.max(0, m.beats[0].time - 0.25);
    } else if (beatIdx >= m.beats.length) {
      const lastB = m.beats[m.beats.length - 1];
      newTime = lastB.time + 0.5;
    } else {
      const prevB = m.beats[beatIdx - 1];
      const nextB = m.beats[beatIdx];
      newTime = (prevB.time + nextB.time) / 2;
    }
  }

  const newBeat = {
    beat: beatIdx + 1,
    time: round3(newTime),
    chord: copiedChord,
    is_downbeat: beatIdx === 0
  };

  m.beats.splice(beatIdx, 0, newBeat);
  recalculateMeasureNumbersAndTimeline();
  renderAllEditorComponents();
  showToast('✓ New empty beat (N) inserted');
}

export function insertBarAt(barIdx) {
  pushHistoryState(`Insert Empty Bar at position ${barIdx + 1}`);
  let newStart = 0;
  let defaultBeatCount = 4;

  if (editorState.measures.length > 0) {
    const refM = barIdx < editorState.measures.length ? editorState.measures[barIdx] : editorState.measures[editorState.measures.length - 1];
    if (refM && refM.beats && refM.beats.length > 0) {
      defaultBeatCount = refM.beats.length;
    }
  }

  if (barIdx === 0) {
    newStart = 0;
  } else if (barIdx >= editorState.measures.length) {
    const lastM = editorState.measures[editorState.measures.length - 1];
    newStart = lastM.end;
  } else {
    const prevM = editorState.measures[barIdx - 1];
    newStart = prevM.end;
  }

  const beats = [];
  for (let b = 1; b <= defaultBeatCount; b++) {
    beats.push({
      beat: b,
      time: round3(newStart + (b - 1) * 0.5),
      chord: 'N',
      is_downbeat: (b === 1)
    });
  }

  const newMeasure = {
    measure: barIdx + 1,
    start: round3(newStart),
    end: round3(newStart + defaultBeatCount * 0.5),
    beats: beats,
    summary: 'N'
  };

  editorState.measures.splice(barIdx, 0, newMeasure);
  recalculateMeasureNumbersAndTimeline();
  renderAllEditorComponents();
  showToast('✓ Empty bar (N) inserted');
}

export function moveBeat(fromBarIdx, fromBeatIdx, toBarIdx, toBeatIdx) {
  pushHistoryState('Move Beat');
  const fromBar = editorState.measures[fromBarIdx];
  const toBar = editorState.measures[toBarIdx];
  if (!fromBar || !toBar) return;

  const [movedBeat] = fromBar.beats.splice(fromBeatIdx, 1);
  if (fromBar.beats.length === 0) {
    editorState.measures.splice(fromBarIdx, 1);
    if (toBarIdx > fromBarIdx) toBarIdx--;
  }

  const targetBar = editorState.measures[toBarIdx];
  if (targetBar) {
    targetBar.beats.splice(toBeatIdx, 0, movedBeat);
  }

  recalculateMeasureNumbersAndTimeline();
  renderAllEditorComponents();
  showToast('✓ Beat moved & timeline realigned');
}

export function moveBar(fromBarIdx, toBarIdx) {
  pushHistoryState('Reorder Measures');
  const [movedBar] = editorState.measures.splice(fromBarIdx, 1);
  editorState.measures.splice(toBarIdx, 0, movedBar);

  recalculateMeasureNumbersAndTimeline();
  renderAllEditorComponents();
  showToast('✓ Measures reordered & timeline realigned');
}

// Normalize beat indices, bar indices, downbeats, and continuous chords timeline
function recalculateMeasureNumbersAndTimeline() {
  const newChordsList = [];
  let prevEnd = 0.0;

  editorState.measures.forEach((m, mIdx) => {
    m.measure = mIdx + 1;
    let barChords = [];

    // Ensure valid start and end bounds
    if (m.start === undefined || m.start === null || m.start < prevEnd) {
      m.start = prevEnd;
    }
    const numBeats = (m.beats && m.beats.length) ? m.beats.length : 4;
    let barDuration = (m.end && m.end > m.start) ? (m.end - m.start) : (numBeats * 0.5);
    if (barDuration < 0.2) barDuration = numBeats * 0.5;
    m.end = round3(m.start + barDuration);
    prevEnd = m.end;

    const beatDur = barDuration / numBeats;

    (m.beats || []).forEach((b, bIdx) => {
      b.beat = bIdx + 1;
      b.is_downbeat = (bIdx === 0);
      b.time = round3(m.start + bIdx * beatDur);
      if (!b.chord) b.chord = 'N';
      if (!barChords.includes(b.chord)) barChords.push(b.chord);

      const bStart = b.time;
      const bEnd = (bIdx + 1 < m.beats.length) ? round3(m.start + (bIdx + 1) * beatDur) : m.end;

      if (!newChordsList.length || newChordsList[newChordsList.length - 1].chord !== b.chord) {
        newChordsList.push({
          start: round3(bStart),
          end: round3(bEnd),
          chord: b.chord,
          duration: round3(bEnd - bStart)
        });
      } else {
        newChordsList[newChordsList.length - 1].end = round3(bEnd);
        newChordsList[newChordsList.length - 1].duration = round3(newChordsList[newChordsList.length - 1].end - newChordsList[newChordsList.length - 1].start);
      }
    });

    m.summary = barChords.join(' → ');
  });

  if (newChordsList.length > 0) {
    editorState.chords = newChordsList;
  }
}

function round3(num) {
  return Math.round((Number(num) || 0) * 1000) / 1000;
}

// --- CHORD PICKER MODAL ---
function setupChordPickerModal() {
  if (!dom.pickerModal) return;

  // Root note chips
  if (dom.pickerRootsGrid) {
    dom.pickerRootsGrid.addEventListener('click', (e) => {
      const chip = e.target.closest('.root-chip');
      if (!chip) return;
      dom.pickerRootsGrid.querySelectorAll('.root-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      updatePickerPreview();
    });
  }

  // Quality chips
  if (dom.pickerQualitiesGrid) {
    dom.pickerQualitiesGrid.addEventListener('click', (e) => {
      const chip = e.target.closest('.quality-chip');
      if (!chip) return;
      dom.pickerQualitiesGrid.querySelectorAll('.quality-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      updatePickerPreview();
    });
  }

  // Custom input
  if (dom.pickerCustomInput) {
    dom.pickerCustomInput.addEventListener('input', () => {
      updatePickerPreview(true);
    });
  }

  // Close / Cancel
  if (dom.btnCancelPicker) dom.btnCancelPicker.addEventListener('click', closeChordPicker);
  if (dom.btnClosePicker) dom.btnClosePicker.addEventListener('click', closeChordPicker);

  // Apply
  if (dom.btnApplyPicker) {
    dom.btnApplyPicker.addEventListener('click', () => {
      applyPickedChord();
    });
  }
}

export function openChordPicker(barIdx, beatIdx, currentChordStr = null, chordIndex = null) {
  const m = editorState.measures[barIdx];
  const b = m && m.beats ? m.beats[beatIdx] : null;
  const rawChord = currentChordStr || (b ? b.chord : 'C');

  // Convert stored raw/sounding chord into the current visual Capo fingering shape for the picker
  const soundingChord = transposeChordName(rawChord, editorState.transposeSemitones || 0);
  const initShape = (editorState.capoFret > 0 && soundingChord !== 'N')
    ? transposeChordName(soundingChord, -editorState.capoFret)
    : soundingChord;

  editorState.pickerTarget = {
    barIdx,
    beatIdx,
    chordIndex,
    initChord: initShape,
    rawChord
  };

  // Immediately illuminate active measure, beat, and chord
  if (m) {
    editorState.currentMeasure = m.measure;
    const capoBadge = editorState.capoFret > 0 ? ` (Capo ${editorState.capoFret})` : '';
    if (dom.activeBarBadge) dom.activeBarBadge.textContent = `BAR ${m.measure}${capoBadge}`;
    document.querySelectorAll('.editor-measure-card.active-tape-bar').forEach(el => el.classList.remove('active-tape-bar'));
    const barEl = document.getElementById(`editor-tape-bar-${m.measure}`);
    if (barEl) barEl.classList.add('active-tape-bar');
  }

  if (b) {
    editorState.currentBeat = b.beat;
    editorState.currentChord = b.chord;
    document.querySelectorAll('.editor-beat-cell.active-tape-beat').forEach(el => el.classList.remove('active-tape-beat'));
    const beatEl = document.getElementById(`editor-tape-beat-${m.measure}-${b.beat}`);
    if (beatEl) beatEl.classList.add('active-tape-beat');
  }

  if (chordIndex !== null && chordIndex >= 0) {
    editorState.currentChordIndex = chordIndex;
    document.querySelectorAll('.editor-chord-card.active').forEach(el => el.classList.remove('active'));
    const chordCardEl = document.getElementById(`editor-chord-card-${chordIndex}`);
    if (chordCardEl) chordCardEl.classList.add('active');
  } else if (b) {
    const cIdx = editorState.chords.findIndex(c => b.time >= c.start && b.time < c.end);
    if (cIdx >= 0) {
      editorState.currentChordIndex = cIdx;
      document.querySelectorAll('.editor-chord-card.active').forEach(el => el.classList.remove('active'));
      const chordCardEl = document.getElementById(`editor-chord-card-${cIdx}`);
      if (chordCardEl) chordCardEl.classList.add('active');
    }
  }

  syncCurrentHeroChord();

  if (dom.pickerTitle) {
    const capoHeader = editorState.capoFret > 0 ? ` (Capo ${editorState.capoFret})` : '';
    dom.pickerTitle.textContent = b ? `Edit Bar ${m.measure} Beat ${b.beat}${capoHeader}` : `Edit Chord${capoHeader}`;
  }

  // Parse root and quality based on the visual fingering shape
  let root = 'C';
  let quality = '';
  if (initShape === 'N') {
    root = 'N';
  } else {
    root = normalizeRoot(initShape.split(':')[0].split('/')[0]) || 'C';
    quality = initShape.includes(':') ? initShape.split(':')[1] : (initShape.slice(root.length) || '');
  }

  if (dom.pickerRootsGrid) {
    dom.pickerRootsGrid.querySelectorAll('.root-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.root === root);
    });
  }

  if (dom.pickerQualitiesGrid) {
    dom.pickerQualitiesGrid.querySelectorAll('.quality-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.quality === quality);
    });
  }

  if (dom.pickerCustomInput) {
    dom.pickerCustomInput.value = '';
  }

  if (dom.pickerApplyWholeBar) {
    dom.pickerApplyWholeBar.checked = false;
  }

  updatePickerPreview();

  if (dom.pickerModal) {
    dom.pickerModal.classList.add('active', 'show');
    dom.pickerModal.setAttribute('aria-hidden', 'false');
  }
}

function updatePickerPreview(fromCustom = false) {
  let shapeChord = 'C';

  if (fromCustom && dom.pickerCustomInput && dom.pickerCustomInput.value.trim()) {
    shapeChord = dom.pickerCustomInput.value.trim();
  } else {
    const activeRoot = dom.pickerRootsGrid?.querySelector('.root-chip.active')?.dataset.root || 'C';
    const activeQuality = dom.pickerQualitiesGrid?.querySelector('.quality-chip.active')?.dataset.quality || '';

    if (activeRoot === 'N') {
      shapeChord = 'N';
      if (dom.pickerQualitiesGrid) dom.pickerQualitiesGrid.style.opacity = '0.3';
    } else {
      if (dom.pickerQualitiesGrid) dom.pickerQualitiesGrid.style.opacity = '1';
      shapeChord = activeQuality ? `${activeRoot}:${activeQuality}` : activeRoot;
    }
  }

  const isRest = shapeChord === 'N';
  const soundingChord = (!isRest && editorState.capoFret > 0)
    ? transposeChordName(shapeChord, editorState.capoFret)
    : shapeChord;

  if (dom.pickerSelectedChord) {
    dom.pickerSelectedChord.textContent = isRest ? 'Rest (N)' : formatChordName(shapeChord);
  }

  if (dom.pickerPreviewLabel) {
    dom.pickerPreviewLabel.textContent = editorState.capoFret > 0
      ? `Fingering Shape (Capo ${editorState.capoFret})`
      : `Selected Chord`;
  }

  if (dom.pickerSoundingChord) {
    if (editorState.capoFret > 0 && !isRest) {
      dom.pickerSoundingChord.textContent = `⚡ Capo ${editorState.capoFret} (Sounds as ${formatChordName(soundingChord)})`;
    } else {
      dom.pickerSoundingChord.textContent = isRest ? 'Rest / Silence' : `Sounding Pitch: ${formatChordName(soundingChord)}`;
    }
  }

  if (dom.pickerMiniPreview) {
    const root = isRest ? 'N' : normalizeRoot(shapeChord.split(':')[0]);
    const rootColor = ROOT_COLORS[root] || '#6366f1';
    dom.pickerMiniPreview.innerHTML = generateMiniGuitarSvg(shapeChord, rootColor);
  }
}

function closeChordPicker() {
  if (dom.pickerModal) {
    dom.pickerModal.classList.remove('active', 'show');
    dom.pickerModal.setAttribute('aria-hidden', 'true');
  }
  editorState.pickerTarget = null;
}

function applyPickedChord() {
  if (!editorState.pickerTarget) return;
  const { barIdx, beatIdx, chordIndex } = editorState.pickerTarget;

  let chosenShape = 'C';
  if (dom.pickerCustomInput && dom.pickerCustomInput.value.trim()) {
    chosenShape = dom.pickerCustomInput.value.trim();
  } else {
    const activeRoot = dom.pickerRootsGrid?.querySelector('.root-chip.active')?.dataset.root || 'C';
    const activeQuality = dom.pickerQualitiesGrid?.querySelector('.quality-chip.active')?.dataset.quality || '';
    chosenShape = activeRoot === 'N' ? 'N' : (activeQuality ? `${activeRoot}:${activeQuality}` : activeRoot);
  }

  // The actual stored song chord:
  // When playing shape S with Capo K and Key Transpose T,
  // sounding chord is S + K, so raw stored chord is (S + K) - T.
  let storedChord = chosenShape;
  if (chosenShape !== 'N') {
    const netShift = (editorState.capoFret || 0) - (editorState.transposeSemitones || 0);
    storedChord = transposeChordName(chosenShape, netShift);
  }

  const applyWholeBar = dom.pickerApplyWholeBar?.checked || false;

  pushHistoryState(`Set chord ${formatChordName(chosenShape)} in Bar ${barIdx + 1}`);

  const m = editorState.measures[barIdx];
  if (m && m.beats) {
    if (applyWholeBar) {
      m.beats.forEach(b => {
        b.chord = storedChord;
      });
    } else if (beatIdx !== null && m.beats[beatIdx]) {
      m.beats[beatIdx].chord = storedChord;
    }
  }

  if (chordIndex !== null && editorState.chords[chordIndex]) {
    editorState.chords[chordIndex].chord = storedChord;
  }

  recalculateMeasureNumbersAndTimeline();
  renderAllEditorComponents();
  closeChordPicker();

  const capoNotice = (editorState.capoFret > 0 && chosenShape !== 'N')
    ? ` (Capo ${editorState.capoFret} → Sounding: ${formatChordName(transposeChordName(chosenShape, editorState.capoFret))})`
    : '';
  showToast(`✓ Applied ${formatChordName(chosenShape)}${capoNotice}`);
}

// --- SAVE & RESET ENDPOINTS ---
export async function saveEditsToDisk() {
  if (dom.btnSave) {
    dom.btnSave.disabled = true;
    dom.btnSave.innerHTML = '<span>⏳ Saving...</span>';
  }

  try {
    // 1. Flatten beats
    const beatsList = [];
    const alignedRecords = [];

    editorState.measures.forEach(m => {
      (m.beats || []).forEach(b => {
        beatsList.push({
          time: round3(b.time),
          beat: b.beat,
          is_downbeat: b.is_downbeat
        });

        alignedRecords.push({
          measure: m.measure,
          beat: b.beat,
          time: round3(b.time),
          is_downbeat: b.is_downbeat,
          chord: b.chord
        });
      });
    });

    const payload = {
      beats: beatsList,
      chords: editorState.chords,
      aligned_records: alignedRecords,
      measures: editorState.measures,
      bpm: editorState.bpm
    };

    const res = await fetch('/api/edit/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to save edits');
    const data = await res.json();

    showToast('💾 Successfully saved chords & beats to disk!');
    if (dom.btnSave) {
      dom.btnSave.innerHTML = '<span>✓ Saved!</span>';
      setTimeout(() => {
        dom.btnSave.disabled = false;
        dom.btnSave.innerHTML = '<span>💾 Save Changes</span>';
      }, 1500);
    }

    // Trigger visualizer refresh event
    window.dispatchEvent(new CustomEvent('chords-updated-on-disk'));
  } catch (err) {
    console.error('Error saving edits:', err);
    showToast(`⚠️ Save failed: ${err.message}`);
    if (dom.btnSave) {
      dom.btnSave.disabled = false;
      dom.btnSave.innerHTML = '<span>💾 Save Changes</span>';
    }
  }
}

export async function resetEditsToAI() {
  if (!confirm('Are you sure you want to reset all chords and beats back to the original AI predictions?')) {
    return;
  }

  try {
    const res = await fetch('/api/edit/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset edits');
    showToast('🔄 Chords & beats reset to AI originals!');
    window.dispatchEvent(new CustomEvent('chords-updated-on-disk'));
  } catch (err) {
    console.error('Error resetting edits:', err);
    showToast(`⚠️ Reset failed: ${err.message}`);
  }
}

// --- SYNCHRONIZED PLAYHEAD IN EDITOR ---
export function updateEditorPlayhead(currentTime) {
  if (!editorState.measures.length) return;

  // 1. Find active measure
  let activeMeasure = null;
  for (let i = 0; i < editorState.measures.length; i++) {
    const m = editorState.measures[i];
    const nextStart = (i + 1 < editorState.measures.length) ? editorState.measures[i + 1].start : m.end + 2.0;
    if (currentTime >= m.start && currentTime < nextStart) {
      activeMeasure = m;
      break;
    }
  }

  if (!activeMeasure && editorState.measures.length) {
    if (currentTime < editorState.measures[0].start) {
      activeMeasure = editorState.measures[0];
    } else {
      activeMeasure = editorState.measures[editorState.measures.length - 1];
    }
  }

  if (activeMeasure) {
    const activeMeasureNum = activeMeasure.measure;

    if (activeMeasureNum !== editorState.currentMeasure) {
      editorState.currentMeasure = activeMeasureNum;
      const capoBadge = editorState.capoFret > 0 ? ` (Capo ${editorState.capoFret})` : '';
      if (dom.activeBarBadge) dom.activeBarBadge.textContent = `BAR ${activeMeasureNum}${capoBadge}`;

      document.querySelectorAll('.editor-measure-card.active-tape-bar').forEach(el => el.classList.remove('active-tape-bar'));
      const barEl = document.getElementById(`editor-tape-bar-${activeMeasureNum}`);
      if (barEl) {
        barEl.classList.add('active-tape-bar');
      }

      if (editorState.autoScroll && dom.tapeViewport) {
        centerEditorMeasureCard(activeMeasureNum, 'smooth');
      }
    }

    // 2. Find active beat within measure
    let activeBeat = (activeMeasure.beats && activeMeasure.beats.length) ? activeMeasure.beats[0] : null;
    for (let j = 0; j < (activeMeasure.beats || []).length; j++) {
      const b = activeMeasure.beats[j];
      const nextTime = (j + 1 < activeMeasure.beats.length) ? activeMeasure.beats[j + 1].time : activeMeasure.end;
      if (currentTime >= b.time && (j === activeMeasure.beats.length - 1 || currentTime < nextTime)) {
        activeBeat = b;
        break;
      }
    }

    if (activeBeat && (activeBeat.beat !== editorState.currentBeat || activeBeat.chord !== editorState.currentChord)) {
      editorState.currentBeat = activeBeat.beat;
      editorState.currentChord = activeBeat.chord;

      document.querySelectorAll('.editor-beat-cell.active-tape-beat').forEach(el => el.classList.remove('active-tape-beat'));
      const beatEl = document.getElementById(`editor-tape-beat-${activeMeasure.measure}-${activeBeat.beat}`);
      if (beatEl) beatEl.classList.add('active-tape-beat');

      syncCurrentHeroChord();
    }
  }

  // 3. Highlight and Auto-scroll active chord in Continuous Chord Stream (Row 2)
  if (editorState.chords && editorState.chords.length) {
    let activeChordIdx = -1;
    for (let c = 0; c < editorState.chords.length; c++) {
      const chordItem = editorState.chords[c];
      if (currentTime >= chordItem.start && currentTime < chordItem.end) {
        activeChordIdx = c;
        break;
      }
    }
    if (activeChordIdx === -1 && currentTime >= editorState.chords[editorState.chords.length - 1].end) {
      activeChordIdx = editorState.chords.length - 1;
    }

    if (activeChordIdx !== editorState.currentChordIndex) {
      editorState.currentChordIndex = activeChordIdx;

      document.querySelectorAll('.editor-chord-card.active').forEach(el => el.classList.remove('active'));
      if (activeChordIdx >= 0) {
        const chordCardEl = document.getElementById(`editor-chord-card-${activeChordIdx}`);
        if (chordCardEl) {
          chordCardEl.classList.add('active');
        }
        if (editorState.autoScroll && dom.chordStreamContainer) {
          centerEditorChordCard(activeChordIdx, 'smooth');
        }
      }
    }
  }
}

function centerEditorMeasureCard(measureNum, behavior = 'smooth') {
  if (!dom.tapeViewport) return;
  const barEl = document.getElementById(`editor-tape-bar-${measureNum}`);
  if (!barEl) return;

  const viewportWidth = dom.tapeViewport.clientWidth;
  const cardLeft = barEl.offsetLeft;
  const cardWidth = barEl.offsetWidth;
  const targetScrollLeft = cardLeft - (viewportWidth / 2) + (cardWidth / 2);

  dom.tapeViewport.scrollTo({
    left: Math.max(0, targetScrollLeft),
    behavior: behavior
  });
}

function centerEditorChordCard(chordIdx, behavior = 'smooth') {
  if (!dom.chordStreamContainer) return;
  const chordCardEl = document.getElementById(`editor-chord-card-${chordIdx}`);
  if (!chordCardEl) return;

  const containerWidth = dom.chordStreamContainer.clientWidth;
  const cardLeft = chordCardEl.offsetLeft;
  const cardWidth = chordCardEl.offsetWidth;
  const targetScrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);

  dom.chordStreamContainer.scrollTo({
    left: Math.max(0, targetScrollLeft),
    behavior: behavior
  });
}

function syncCurrentHeroChord() {
  const currentChord = editorState.currentChord || 'C';
  const soundingChord = transposeChordName(currentChord, editorState.transposeSemitones);
  const effectiveChord = (editorState.capoFret > 0 && soundingChord !== 'N')
    ? transposeChordName(soundingChord, -editorState.capoFret)
    : soundingChord;

  const isRest = effectiveChord === 'N';
  const root = isRest ? 'N' : normalizeRoot(effectiveChord.split(':')[0]);
  const rootColor = ROOT_COLORS[root] || '#6366f1';
  const displayName = isRest ? 'Rest' : formatChordName(effectiveChord);

  if (dom.heroChordName) {
    dom.heroChordName.textContent = displayName;
    dom.heroChordName.style.color = isRest ? '#94a3b8' : rootColor;
  }
  if (dom.heroBeatText) {
    dom.heroBeatText.textContent = `Bar ${editorState.currentMeasure} · Beat ${editorState.currentBeat}`;
  }
  if (dom.heroChordDesc) {
    if (editorState.capoFret > 0 && soundingChord !== 'N') {
      dom.heroChordDesc.textContent = `Capo ${editorState.capoFret} Shape (Sounding: ${formatChordName(soundingChord)})`;
    } else {
      dom.heroChordDesc.textContent = isRest ? 'Rest' : `Sounding: ${formatChordName(soundingChord)}`;
    }
  }

  // Update guitar preview
  if (dom.guitarChordSvg) {
    renderGuitarChord(
      dom.guitarChordSvg,
      dom.guitarChordTitle,
      dom.guitarStringNotes,
      dom.guitarFingeringLabel,
      effectiveChord,
      editorState.capoFret,
      dom.guitarSoundingTitle
    );
  }

  // Update piano preview
  if (dom.pianoKeyboard) {
    const chordNotes = getChordNotes(soundingChord);
    highlightPianoNotes(dom.pianoKeyboard, dom.notesLabel, chordNotes);
  }
}

function applyEditorFilter() {
  const q = editorState.filterText;
  if (!q) {
    document.querySelectorAll('.editor-measure-card, .editor-chord-card').forEach(el => el.style.display = '');
    return;
  }
  document.querySelectorAll('.editor-measure-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? '' : 'none';
  });
  document.querySelectorAll('.editor-chord-card').forEach(card => {
    const text = (card.dataset.chord || '').toLowerCase();
    card.style.display = text.includes(q) ? '' : 'none';
  });
}

function showToast(message) {
  let toast = document.getElementById('editor-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'editor-toast';
    toast.className = 'editor-toast-banner';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}
