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
  audioPlayer: null,
  viewMode: 'sliding', // 'sliding' | 'grid'
  windowSize: 7
};

let dom = {
  container: null,
  measuresGrid: null,
  totalBarsEl: null,
  bpmEl: null,
  totalBeatsEl: null,
  filterInput: null,
  autoScrollToggle: null,
  dualTimelineTrack: null,

  // Sliding Window DOM elements
  btnModeSliding: null,
  btnModeGrid: null,
  slidingContainer: null,
  gridContainer: null,
  spotlightBarTitle: null,
  spotlightBarTime: null,
  spotlightBeatsRow: null,
  btnSpotlightPrev: null,
  btnSpotlightNext: null,
  slidingTapeViewport: null,
  slidingTapeTrack: null,
  windowSizeSelect: null
};

export async function initAlignmentView(audioEl) {
  alignedState.audioPlayer = audioEl;
  dom.container = document.getElementById('view-alignment');
  dom.measuresGrid = document.getElementById('alignment-measures-grid');
  dom.totalBarsEl = document.getElementById('align-total-bars');
  dom.bpmEl = document.getElementById('align-bpm');
  dom.totalBeatsEl = document.getElementById('align-total-beats');
  dom.filterInput = document.getElementById('align-filter-input');
  dom.autoScrollToggle = document.getElementById('align-auto-scroll');
  dom.dualTimelineTrack = document.getElementById('alignment-dual-track');

  // Sliding window elements
  dom.btnModeSliding = document.getElementById('btn-align-mode-sliding');
  dom.btnModeGrid = document.getElementById('btn-align-mode-grid');
  dom.slidingContainer = document.getElementById('align-sliding-container');
  dom.gridContainer = document.getElementById('align-grid-container');
  dom.spotlightBarTitle = document.getElementById('spotlight-bar-title');
  dom.spotlightBarTime = document.getElementById('spotlight-bar-time');
  dom.spotlightBeatsRow = document.getElementById('spotlight-beats-row');
  dom.btnSpotlightPrev = document.getElementById('btn-spotlight-prev');
  dom.btnSpotlightNext = document.getElementById('btn-spotlight-next');
  dom.slidingTapeViewport = document.getElementById('sliding-tape-viewport');
  dom.slidingTapeTrack = document.getElementById('sliding-tape-track');
  dom.windowSizeSelect = document.getElementById('sliding-window-size-select');

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

  if (dom.btnModeSliding) {
    dom.btnModeSliding.addEventListener('click', () => switchAlignMode('sliding'));
  }
  if (dom.btnModeGrid) {
    dom.btnModeGrid.addEventListener('click', () => switchAlignMode('grid'));
  }

  if (dom.btnSpotlightPrev) {
    dom.btnSpotlightPrev.addEventListener('click', () => {
      jumpToAdjacentMeasure(-1);
    });
  }
  if (dom.btnSpotlightNext) {
    dom.btnSpotlightNext.addEventListener('click', () => {
      jumpToAdjacentMeasure(1);
    });
  }

  if (dom.windowSizeSelect) {
    dom.windowSizeSelect.addEventListener('change', (e) => {
      alignedState.windowSize = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
      updateSlidingTapeViewportStyle();
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

function switchAlignMode(mode) {
  alignedState.viewMode = mode;
  const isSliding = mode === 'sliding';

  if (dom.btnModeSliding) dom.btnModeSliding.classList.toggle('active', isSliding);
  if (dom.btnModeGrid) dom.btnModeGrid.classList.toggle('active', !isSliding);

  if (dom.slidingContainer) dom.slidingContainer.style.display = isSliding ? 'flex' : 'none';
  if (dom.gridContainer) dom.gridContainer.style.display = isSliding ? 'none' : 'block';

  if (isSliding && alignedState.currentMeasure > 0) {
    renderSpotlightStage(alignedState.currentMeasure);
    centerMeasureInSlidingTape(alignedState.currentMeasure, 'smooth');
  }
}

function updateSlidingTapeViewportStyle() {
  if (!dom.slidingTapeTrack) return;
  // Re-center on active bar
  if (alignedState.currentMeasure > 0) {
    centerMeasureInSlidingTape(alignedState.currentMeasure, 'auto');
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

    renderMeasuresGrid();
    renderSlidingTapeTrack();
    renderDualTimelineTrack();

    if (alignedState.measures.length > 0) {
      renderSpotlightStage(alignedState.measures[0].measure);
    }
  } catch (err) {
    console.warn('Error loading aligned chords:', err);
    if (dom.measuresGrid) {
      dom.measuresGrid.innerHTML = `
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
  renderMeasuresGrid();
  renderSlidingTapeTrack();
  renderDualTimelineTrack();
  if (alignedState.currentMeasure > 0) {
    renderSpotlightStage(alignedState.currentMeasure);
  }
}

export function applyAlignmentCapo(capoFret) {
  alignedState.capoFret = capoFret;
  renderMeasuresGrid();
  renderSlidingTapeTrack();
  renderDualTimelineTrack();
  if (alignedState.currentMeasure > 0) {
    renderSpotlightStage(alignedState.currentMeasure);
  }
}

/**
 * Render the Spotlight Stage (Zoomed Active Measure with 4 large beats)
 */
function renderSpotlightStage(measureNum) {
  if (!dom.spotlightBeatsRow) return;

  const m = alignedState.measures.find(item => item.measure === measureNum) || alignedState.measures[0];
  if (!m) {
    dom.spotlightBeatsRow.innerHTML = '<div class="empty-state">No measure data.</div>';
    return;
  }

  const capoBadge = alignedState.capoFret > 0 ? `<span class="spotlight-capo-pill">🎸 Capo ${alignedState.capoFret}</span>` : '';
  if (dom.spotlightBarTitle) dom.spotlightBarTitle.innerHTML = `BAR ${m.measure} ${capoBadge}`;
  if (dom.spotlightBarTime) dom.spotlightBarTime.textContent = `${m.start.toFixed(2)}s – ${m.end.toFixed(2)}s (${(m.end - m.start).toFixed(2)}s dur)`;

  let html = '';
  m.beats.forEach(b => {
    const soundingChord = transposeChordName(b.chord, alignedState.transposeSemitones);
    const effectiveGuitarChord = (alignedState.capoFret > 0 && soundingChord !== 'N')
      ? transposeChordName(soundingChord, -alignedState.capoFret)
      : soundingChord;

    const isRest = effectiveGuitarChord === 'N';
    const root = isRest ? 'N' : normalizeRoot(effectiveGuitarChord.split(':')[0]);
    const rootColor = ROOT_COLORS[root] || '#6366f1';
    const displayName = isRest ? '— Rest —' : formatChordName(effectiveGuitarChord);
    const miniGuitar = isRest ? '' : generateMiniGuitarSvg(effectiveGuitarChord, rootColor);
    const soundingSub = (alignedState.capoFret > 0 && !isRest)
      ? `<div class="spotlight-sounding-sub">Sounding: <strong>${formatChordName(soundingChord)}</strong></div>`
      : '';

    html += `
      <div class="spotlight-beat-box ${b.is_downbeat ? 'downbeat-box' : ''}" 
           id="spotlight-beat-${b.beat}"
           data-time="${b.time}"
           data-beat="${b.beat}"
           title="Jump to Beat ${b.beat} (${b.time}s)">
        <div class="spotlight-beat-top" style="background: ${isRest ? 'rgba(255,255,255,0.06)' : rootColor}">
          <span class="spotlight-beat-tag">BEAT ${b.beat} ${b.is_downbeat ? '★' : ''}</span>
          <span class="spotlight-beat-time">${b.time.toFixed(2)}s</span>
        </div>
        <div class="spotlight-beat-chord" style="color: ${isRest ? '#94a3b8' : '#ffffff'}">${displayName}</div>
        ${soundingSub}
        <div class="spotlight-mini-chart">${miniGuitar}</div>
      </div>
    `;
  });

  dom.spotlightBeatsRow.innerHTML = html;

  dom.spotlightBeatsRow.querySelectorAll('.spotlight-beat-box').forEach(box => {
    box.addEventListener('click', () => {
      const seekTime = parseFloat(box.dataset.time);
      if (alignedState.audioPlayer && !isNaN(seekTime)) {
        alignedState.audioPlayer.currentTime = seekTime + 0.01;
        if (alignedState.audioPlayer.paused) {
          alignedState.audioPlayer.play().catch(() => {});
        }
      }
    });
  });
}

/**
 * Render horizontal Sliding Tape Track
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

    let beatsHtml = '';
    transposedBeats.forEach(b => {
      const displayName = b.isRest ? '—' : formatChordName(b.transChord);
      beatsHtml += `
        <div class="tape-beat-cell ${b.is_downbeat ? 'downbeat-cell' : ''}" 
             id="tape-beat-${m.measure}-${b.beat}"
             data-time="${b.time}"
             title="Bar ${m.measure} Beat ${b.beat} (${b.time}s): ${displayName}">
          <div class="tape-beat-accent" style="background: ${b.isRest ? 'transparent' : b.rootColor}"></div>
          <div class="tape-beat-num">b${b.beat}</div>
          <div class="tape-beat-chord" style="color: ${b.isRest ? '#94a3b8' : '#ffffff'}">${displayName}</div>
        </div>
      `;
    });

    tapeCard.innerHTML = `
      <div class="tape-card-header">
        <span class="tape-bar-num">BAR ${m.measure}</span>
        <span class="tape-bar-time">${m.start.toFixed(1)}s</span>
      </div>
      <div class="tape-beats-row">
        ${beatsHtml}
      </div>
    `;

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

/**
 * Render Full Lead Sheet Grid
 */
function renderMeasuresGrid() {
  if (!dom.measuresGrid) return;
  dom.measuresGrid.innerHTML = '';

  if (!alignedState.measures.length) {
    dom.measuresGrid.innerHTML = '<div class="empty-state">No beat-aligned measures available.</div>';
    return;
  }

  const frag = document.createDocumentFragment();

  alignedState.measures.forEach(m => {
    const barCard = document.createElement('div');
    barCard.className = 'measure-card';
    barCard.id = `measure-card-${m.measure}`;
    barCard.dataset.measure = m.measure;
    barCard.dataset.start = m.start;
    barCard.dataset.end = m.end;

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
    barCard.dataset.chords = uniqueChords.join(' ').toLowerCase();

    // Measure Header
    let beatsHtml = '';
    transposedBeats.forEach(b => {
      const displayName = b.isRest ? '—' : formatChordName(b.transChord);
      beatsHtml += `
        <div class="measure-beat-cell ${b.is_downbeat ? 'downbeat-cell' : ''}" 
             id="beat-cell-${m.measure}-${b.beat}"
             data-time="${b.time}" 
             data-measure="${m.measure}"
             data-beat="${b.beat}"
             title="Jump to Bar ${m.measure} Beat ${b.beat} (${b.time}s)">
          <div class="beat-cell-accent" style="background: ${b.isRest ? 'transparent' : b.rootColor}"></div>
          <div class="beat-cell-num">B${b.beat}</div>
          <div class="beat-cell-chord" style="color: ${b.isRest ? '#94a3b8' : '#ffffff'}">${displayName}</div>
          <div class="beat-cell-time">${b.time.toFixed(1)}s</div>
        </div>
      `;
    });

    barCard.innerHTML = `
      <div class="measure-card-header">
        <div class="measure-number-tag">
          <span class="measure-icon">🎼</span>
          <strong>BAR ${m.measure}</strong>
        </div>
        <div class="measure-time-range">${m.start.toFixed(1)}s – ${m.end.toFixed(1)}s</div>
      </div>
      <div class="measure-beats-row">
        ${beatsHtml}
      </div>
    `;

    // Click handler for seeking
    barCard.querySelectorAll('.measure-beat-cell').forEach(cell => {
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

    barCard.addEventListener('click', () => {
      const seekTime = parseFloat(barCard.dataset.start);
      if (alignedState.audioPlayer && !isNaN(seekTime)) {
        alignedState.audioPlayer.currentTime = seekTime + 0.01;
        if (alignedState.audioPlayer.paused) {
          alignedState.audioPlayer.play().catch(() => {});
        }
      }
    });

    frag.appendChild(barCard);
  });

  dom.measuresGrid.appendChild(frag);
}

function renderDualTimelineTrack() {
  if (!dom.dualTimelineTrack) return;
  dom.dualTimelineTrack.innerHTML = '';

  const total = (alignedState.measures.length ? alignedState.measures[alignedState.measures.length - 1].end : 0) || 1;
  if (total <= 0) return;

  const frag = document.createDocumentFragment();

  alignedState.measures.forEach(m => {
    const leftPct = (m.start / total) * 100;
    const widthPct = Math.max(0.5, ((m.end - m.start) / total) * 100);

    const firstBeat = m.beats[0];
    let transChord = 'N';
    if (firstBeat) {
      const sounding = transposeChordName(firstBeat.chord, alignedState.transposeSemitones);
      transChord = (alignedState.capoFret > 0 && sounding !== 'N')
        ? transposeChordName(sounding, -alignedState.capoFret)
        : sounding;
    }

    const root = transChord === 'N' ? 'N' : normalizeRoot(transChord.split(':')[0]);
    const rootColor = ROOT_COLORS[root] || '#6366f1';

    const barSegment = document.createElement('div');
    barSegment.className = 'dual-track-bar';
    barSegment.id = `dual-bar-${m.measure}`;
    barSegment.style.left = `${leftPct}%`;
    barSegment.style.width = `${widthPct}%`;
    barSegment.style.borderTopColor = rootColor;
    barSegment.title = `Bar ${m.measure} (${m.start}s - ${m.end}s): ${m.summary}`;

    barSegment.innerHTML = `
      <span class="dual-bar-label">${m.measure}</span>
      <span class="dual-bar-chord">${transChord !== 'N' ? transChord : ''}</span>
    `;

    barSegment.addEventListener('click', () => {
      if (alignedState.audioPlayer) {
        alignedState.audioPlayer.currentTime = m.start + 0.01;
        if (alignedState.audioPlayer.paused) alignedState.audioPlayer.play().catch(() => {});
      }
    });

    frag.appendChild(barSegment);
  });

  dom.dualTimelineTrack.appendChild(frag);
}

function filterMeasures() {
  const q = alignedState.filterQuery;

  // Filter Full Grid
  if (dom.measuresGrid) {
    const cards = dom.measuresGrid.querySelectorAll('.measure-card');
    cards.forEach(c => {
      if (!q) {
        c.style.display = 'flex';
        return;
      }
      const mNum = c.dataset.measure;
      const chords = c.dataset.chords || '';
      if (mNum === q || chords.includes(q) || `bar ${mNum}`.includes(q)) {
        c.style.display = 'flex';
      } else {
        c.style.display = 'none';
      }
    });
  }

  // Filter Tape
  if (dom.slidingTapeTrack) {
    const tapeCards = dom.slidingTapeTrack.querySelectorAll('.tape-measure-card');
    tapeCards.forEach(c => {
      if (!q) {
        c.style.opacity = '1';
        return;
      }
      const mNum = c.dataset.measure;
      if (mNum === q || `bar ${mNum}`.includes(q)) {
        c.style.opacity = '1';
      } else {
        c.style.opacity = '0.3';
      }
    });
  }
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
    onMeasureChanged(activeMeasureNum);
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

  // Update dual track playhead
  const total = (alignedState.measures.length ? alignedState.measures[alignedState.measures.length - 1].end : 0) || 1;
  const playheadEl = document.getElementById('dual-track-playhead');
  if (playheadEl && total > 0) {
    const pct = Math.min(100, Math.max(0, (currentTime / total) * 100));
    playheadEl.style.left = `${pct}%`;
  }
}

function onMeasureChanged(measureNum) {
  if (measureNum <= 0) return;

  // 1. Update Spotlight Active Measure Stage
  renderSpotlightStage(measureNum);

  // 2. Update Sliding Tape Active Bar & Center Position
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

  // 3. Update Grid Active Bar
  if (dom.measuresGrid) {
    const allCards = dom.measuresGrid.querySelectorAll('.measure-card');
    allCards.forEach(c => c.classList.remove('active'));

    const activeCard = document.getElementById(`measure-card-${measureNum}`);
    if (activeCard) {
      activeCard.classList.add('active');
      if (alignedState.autoScroll && alignedState.viewMode === 'grid') {
        activeCard.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }

  // 4. Update Dual Track Bar
  const dualBars = document.querySelectorAll('.dual-track-bar');
  dualBars.forEach(b => b.classList.remove('active'));
  const activeDualBar = document.getElementById(`dual-bar-${measureNum}`);
  if (activeDualBar) {
    activeDualBar.classList.add('active');
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
  // Highlight in Grid
  if (dom.measuresGrid) {
    const allCells = dom.measuresGrid.querySelectorAll('.measure-beat-cell');
    allCells.forEach(cell => cell.classList.remove('active-beat'));

    const activeCell = document.getElementById(`beat-cell-${measureNum}-${beatNum}`);
    if (activeCell) {
      activeCell.classList.add('active-beat');
    }
  }

  // Highlight in Tape
  if (dom.slidingTapeTrack) {
    const tapeCells = dom.slidingTapeTrack.querySelectorAll('.tape-beat-cell');
    tapeCells.forEach(cell => cell.classList.remove('active-beat'));

    const activeTapeCell = document.getElementById(`tape-beat-${measureNum}-${beatNum}`);
    if (activeTapeCell) {
      activeTapeCell.classList.add('active-beat');
    }
  }

  // Highlight in Spotlight Stage
  if (dom.spotlightBeatsRow) {
    const spotBoxes = dom.spotlightBeatsRow.querySelectorAll('.spotlight-beat-box');
    spotBoxes.forEach(box => box.classList.remove('active-beat'));

    const activeSpotBox = document.getElementById(`spotlight-beat-${beatNum}`);
    if (activeSpotBox) {
      activeSpotBox.classList.add('active-beat');
    }
  }
}
