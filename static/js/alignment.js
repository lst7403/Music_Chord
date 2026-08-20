import { ROOT_COLORS } from './constants.js';
import { normalizeRoot, formatChordName, transposeChordName } from './music.js';
import { formatTime, formatTimePrecise, generateMiniGuitarSvg } from './timeline.js';

let alignedState = {
  measures: [],
  records: [],
  totalMeasures: 0,
  totalBeats: 0,
  bpm: 0,
  currentMeasure: -1,
  currentBeat: -1,
  transposeSemitones: 0,
  capoFret: 0,
  autoScroll: true,
  filterQuery: '',
  audioPlayer: null
};

let dom = {
  container: null,
  totalBarsEl: null,
  bpmEl: null,
  totalBeatsEl: null,
  filterInput: null,
  autoScrollToggle: null,

  // Rolling Measure Tape DOM elements
  tapeActiveBarBadge: null,
  tapeActiveBarTime: null,
  btnTapePrevBar: null,
  btnTapeNextBar: null,
  slidingTapeViewport: null,
  slidingTapeTrack: null
};

export async function initAlignmentView(audioEl) {
  alignedState.audioPlayer = audioEl;
  dom.container = document.getElementById('view-alignment');
  dom.totalBarsEl = document.getElementById('align-total-bars');
  dom.bpmEl = document.getElementById('align-bpm');
  dom.totalBeatsEl = document.getElementById('align-total-beats');
  dom.filterInput = document.getElementById('align-filter-input');
  dom.autoScrollToggle = document.getElementById('align-auto-scroll');

  // Rolling Tape Elements
  dom.tapeActiveBarBadge = document.getElementById('tape-active-bar-badge');
  dom.tapeActiveBarTime = document.getElementById('tape-active-bar-time');
  dom.btnTapePrevBar = document.getElementById('btn-tape-prev-bar');
  dom.btnTapeNextBar = document.getElementById('btn-tape-next-bar');
  dom.slidingTapeViewport = document.getElementById('sliding-tape-viewport');
  dom.slidingTapeTrack = document.getElementById('sliding-tape-track');

  setupAlignmentEventListeners();
  await loadAlignedData();
}

function setupAlignmentEventListeners() {
  if (dom.filterInput) {
    dom.filterInput.addEventListener('input', (e) => {
      alignedState.filterQuery = (e.target.value || '').toLowerCase().trim();
      filterMeasures();
    });
  }

  if (dom.autoScrollToggle) {
    dom.autoScrollToggle.addEventListener('change', (e) => {
      alignedState.autoScroll = e.target.checked;
    });
  }

  if (dom.btnTapePrevBar) {
    dom.btnTapePrevBar.addEventListener('click', () => {
      jumpToAdjacentMeasure(-1);
    });
  }
  if (dom.btnTapeNextBar) {
    dom.btnTapeNextBar.addEventListener('click', () => {
      jumpToAdjacentMeasure(1);
    });
  }

  if (dom.slidingTapeViewport) {
    dom.slidingTapeViewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        dom.slidingTapeViewport.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }
}

function jumpToAdjacentMeasure(delta) {
  if (!alignedState.measures.length) return;
  const curIdx = alignedState.measures.findIndex(m => m.measure === alignedState.currentMeasure);
  const nextIdx = Math.max(0, Math.min(alignedState.measures.length - 1, (curIdx >= 0 ? curIdx : 0) + delta));
  const targetBar = alignedState.measures[nextIdx];
  if (targetBar && alignedState.audioPlayer) {
    alignedState.audioPlayer.currentTime = targetBar.start + 0.01;
    if (alignedState.audioPlayer.paused) {
      alignedState.audioPlayer.play().catch(() => {});
    }
  }
}

export async function loadAlignedData() {
  try {
    const res = await fetch('/api/aligned-chords');
    if (!res.ok) throw new Error('Failed to fetch aligned chords');
    const data = await res.json();

    alignedState.measures = data.measures || [];
    alignedState.records = data.records || [];
    alignedState.totalMeasures = data.total_measures || 0;
    alignedState.totalBeats = data.total_beats || 0;
    alignedState.bpm = data.bpm || 0;

    if (dom.totalBarsEl) dom.totalBarsEl.textContent = alignedState.totalMeasures;
    if (dom.bpmEl) dom.bpmEl.textContent = alignedState.bpm ? `${alignedState.bpm} BPM` : '-- BPM';
    if (dom.totalBeatsEl) dom.totalBeatsEl.textContent = alignedState.totalBeats;

    renderSlidingTapeTrack();

    if (alignedState.measures.length > 0) {
      updateActiveMeasureBadge(alignedState.measures[0]);
    }
  } catch (err) {
    console.warn('Error loading aligned chords:', err);
    if (dom.slidingTapeTrack) {
      dom.slidingTapeTrack.innerHTML = `
        <div class="empty-state">
          ⚠️ Could not load aligned chords. Please run <code>align.ipynb</code> or process a song!
        </div>
      `;
    }
  }
}

export function applyAlignmentTransposition(semitones, capoFret = 0) {
  alignedState.transposeSemitones = semitones;
  alignedState.capoFret = capoFret;
  renderSlidingTapeTrack();
  if (alignedState.currentMeasure > 0) {
    const curM = alignedState.measures.find(m => m.measure === alignedState.currentMeasure);
    if (curM) updateActiveMeasureBadge(curM);
  }
}

export function applyAlignmentCapo(capoFret) {
  alignedState.capoFret = capoFret;
  renderSlidingTapeTrack();
  if (alignedState.currentMeasure > 0) {
    const curM = alignedState.measures.find(m => m.measure === alignedState.currentMeasure);
    if (curM) updateActiveMeasureBadge(curM);
  }
}

function updateActiveMeasureBadge(m) {
  if (!m) return;
  const capoBadge = alignedState.capoFret > 0 ? ` (Capo ${alignedState.capoFret})` : '';
  if (dom.tapeActiveBarBadge) dom.tapeActiveBarBadge.textContent = `BAR ${m.measure}${capoBadge}`;
  if (dom.tapeActiveBarTime) dom.tapeActiveBarTime.textContent = `${m.start.toFixed(2)}s – ${m.end.toFixed(2)}s (${(m.end - m.start).toFixed(2)}s dur)`;
}

/**
 * Render the Rich Single Rolling Measure Tape
 */
function renderSlidingTapeTrack() {
  if (!dom.slidingTapeTrack) return;
  dom.slidingTapeTrack.innerHTML = '';

  if (!alignedState.measures.length) {
    dom.slidingTapeTrack.innerHTML = '<div class="empty-state">No measures available.</div>';
    return;
  }

  const frag = document.createDocumentFragment();

  alignedState.measures.forEach(m => {
    const tapeCard = document.createElement('div');
    tapeCard.className = 'tape-measure-card';
    tapeCard.id = `tape-bar-${m.measure}`;
    tapeCard.dataset.measure = m.measure;
    tapeCard.dataset.start = m.start;
    tapeCard.dataset.end = m.end;

    // Transpose chords in beats with Capo
    const transposedBeats = m.beats.map(b => {
      const soundingChord = transposeChordName(b.chord, alignedState.transposeSemitones);
      const effectiveGuitarChord = (alignedState.capoFret > 0 && soundingChord !== 'N')
        ? transposeChordName(soundingChord, -alignedState.capoFret)
        : soundingChord;

      const isRest = effectiveGuitarChord === 'N';
      const root = isRest ? 'N' : normalizeRoot(effectiveGuitarChord.split(':')[0]);
      const rootColor = ROOT_COLORS[root] || '#6366f1';
      return {
        ...b,
        transChord: effectiveGuitarChord,
        soundingChord,
        isRest,
        rootColor
      };
    });

    const uniqueChords = [...new Set(transposedBeats.map(b => b.transChord))];
    tapeCard.dataset.chords = uniqueChords.join(' ').toLowerCase();

    let beatsHtml = '';
    transposedBeats.forEach(b => {
      const displayName = b.isRest ? '— Rest —' : formatChordName(b.transChord);
      const miniGuitar = b.isRest ? '' : generateMiniGuitarSvg(b.transChord, b.rootColor);
      const soundingSub = (alignedState.capoFret > 0 && !b.isRest)
        ? `<div class="tape-beat-sounding">Pitch: <strong>${formatChordName(b.soundingChord)}</strong></div>`
        : '';

      beatsHtml += `
        <div class="tape-beat-cell ${b.is_downbeat ? 'downbeat-cell' : ''}" 
             id="tape-beat-${m.measure}-${b.beat}"
             data-time="${b.time}"
             title="Jump to Bar ${m.measure} Beat ${b.beat} (${b.time.toFixed(2)}s)">
          <div class="tape-beat-top" style="background: ${b.isRest ? 'rgba(255,255,255,0.06)' : b.rootColor}">
            <span class="tape-beat-tag">B${b.beat} ${b.is_downbeat ? '★' : ''}</span>
            <span class="tape-beat-time">${b.time.toFixed(1)}s</span>
          </div>
          <div class="tape-beat-chord" style="color: ${b.isRest ? '#94a3b8' : '#ffffff'}">${displayName}</div>
          ${soundingSub}
          <div class="tape-mini-chart">${miniGuitar}</div>
        </div>
      `;
    });

    const capoTag = alignedState.capoFret > 0 ? `<span class="tape-capo-pill">Capo ${alignedState.capoFret}</span>` : '';

    tapeCard.innerHTML = `
      <div class="tape-card-header">
        <div class="tape-bar-num-wrap">
          <span class="tape-bar-num">BAR ${m.measure}</span>
          ${capoTag}
        </div>
        <span class="tape-bar-time">${m.start.toFixed(2)}s – ${m.end.toFixed(2)}s</span>
      </div>
      <div class="tape-beats-row">
        ${beatsHtml}
      </div>
    `;

    // Click handler on individual beats
    tapeCard.querySelectorAll('.tape-beat-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        const seekTime = parseFloat(cell.dataset.time);
        if (alignedState.audioPlayer && !isNaN(seekTime)) {
          alignedState.audioPlayer.currentTime = seekTime + 0.01;
          if (alignedState.audioPlayer.paused) {
            alignedState.audioPlayer.play().catch(() => {});
          }
        }
      });
    });

    tapeCard.addEventListener('click', () => {
      if (alignedState.audioPlayer) {
        alignedState.audioPlayer.currentTime = m.start + 0.01;
        if (alignedState.audioPlayer.paused) {
          alignedState.audioPlayer.play().catch(() => {});
        }
      }
    });

    frag.appendChild(tapeCard);
  });

  dom.slidingTapeTrack.appendChild(frag);
}

function filterMeasures() {
  const q = alignedState.filterQuery;
  if (!dom.slidingTapeTrack) return;

  const tapeCards = dom.slidingTapeTrack.querySelectorAll('.tape-measure-card');
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

/**
 * Real-time synchronization callback invoked on animation loop
 */
export function updateAlignmentPlayhead(currentTime) {
  if (!alignedState.measures.length) return;

  // Find active measure
  let activeMeasureObj = null;
  for (let i = 0; i < alignedState.measures.length; i++) {
    const m = alignedState.measures[i];
    if (currentTime >= m.start && currentTime < m.end) {
      activeMeasureObj = m;
      break;
    }
  }

  if (!activeMeasureObj && currentTime >= alignedState.measures[alignedState.measures.length - 1].end) {
    activeMeasureObj = alignedState.measures[alignedState.measures.length - 1];
  }

  const activeMeasureNum = activeMeasureObj ? activeMeasureObj.measure : -1;

  if (activeMeasureNum !== alignedState.currentMeasure) {
    alignedState.currentMeasure = activeMeasureNum;
    onMeasureChanged(activeMeasureObj);
  }

  // Highlight specific active beat cell within measure
  if (activeMeasureObj) {
    let activeBeatNum = 1;
    for (let i = 0; i < activeMeasureObj.beats.length; i++) {
      const b = activeMeasureObj.beats[i];
      if (currentTime >= b.time && (i === activeMeasureObj.beats.length - 1 || currentTime < activeMeasureObj.beats[i+1].time)) {
        activeBeatNum = b.beat;
        break;
      }
    }

    if (activeBeatNum !== alignedState.currentBeat) {
      alignedState.currentBeat = activeBeatNum;
      highlightActiveBeatCell(activeMeasureNum, activeBeatNum);
    }
  }
}

function onMeasureChanged(activeMeasureObj) {
  if (!activeMeasureObj) return;
  const measureNum = activeMeasureObj.measure;

  // Update top active bar badge
  updateActiveMeasureBadge(activeMeasureObj);

  // Update Sliding Tape Active Bar & Center Position
  if (dom.slidingTapeTrack) {
    const tapeCards = dom.slidingTapeTrack.querySelectorAll('.tape-measure-card');
    tapeCards.forEach(c => c.classList.remove('active'));

    const activeTapeCard = document.getElementById(`tape-bar-${measureNum}`);
    if (activeTapeCard) {
      activeTapeCard.classList.add('active');
    }

    if (alignedState.autoScroll) {
      centerMeasureInSlidingTape(measureNum, 'smooth');
    }
  }
}

function centerMeasureInSlidingTape(measureNum, behavior = 'smooth') {
  if (!dom.slidingTapeViewport) return;
  const activeTapeCard = document.getElementById(`tape-bar-${measureNum}`);
  if (!activeTapeCard) return;

  const viewportWidth = dom.slidingTapeViewport.clientWidth;
  const cardLeft = activeTapeCard.offsetLeft;
  const cardWidth = activeTapeCard.offsetWidth;

  const targetScrollLeft = cardLeft - (viewportWidth / 2) + (cardWidth / 2);

  dom.slidingTapeViewport.scrollTo({
    left: Math.max(0, targetScrollLeft),
    behavior: behavior
  });
}

function highlightActiveBeatCell(measureNum, beatNum) {
  if (!dom.slidingTapeTrack) return;
  const tapeCells = dom.slidingTapeTrack.querySelectorAll('.tape-beat-cell');
  tapeCells.forEach(cell => cell.classList.remove('active-beat'));

  const activeTapeCell = document.getElementById(`tape-beat-${measureNum}-${beatNum}`);
  if (activeTapeCell) {
    activeTapeCell.classList.add('active-beat');
  }
}
