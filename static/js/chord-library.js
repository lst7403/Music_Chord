/* =========================================================
   ChordVision — Guitar Chord Library & Voicings Catalog
   Displays complete CHORD_ALTERNATIVES_DB database
   ========================================================= */

import { ROOT_COLORS, PITCH_CLASSES, FLATS_TO_SHARPS, CHORD_ALTERNATIVES_DB } from './constants.js';
import { normalizeRoot, formatChordName, getChordNotes } from './music.js';
import { playGuitarStrum } from './audio-synth.js';

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
const OPEN_STRING_INDICES = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, e

const QUALITY_ORDER = [
  '',         // Major
  'min',      // Minor
  'dim',      // Diminished
  'aug',      // Augmented
  'maj6',     // Major 6
  '6',
  'min6',     // Minor 6
  'maj7',     // Major 7
  'min7',     // Minor 7
  '7',        // Dominant 7
  'minmaj7',  // Minor Major 7
  'dim7',     // Diminished 7
  'hdim7',    // Half-diminished (m7b5)
  'sus2',     // Sus2
  'sus4',     // Sus4
  'sus'       // Sus alias
];

const QUALITY_GROUPS = [
  { id: 'all', label: 'All Qualities' },
  { id: 'maj', label: 'Major', match: (k) => !k.includes(':') || k.endsWith(':maj') },
  { id: 'min', label: 'Minor (m)', match: (k) => (k.split(':')[1] || '') === 'min' },
  { id: 'dim', label: 'Diminished (dim)', match: (k) => (k.split(':')[1] || '') === 'dim' },
  { id: 'aug', label: 'Augmented (aug)', match: (k) => (k.split(':')[1] || '') === 'aug' },
  { id: 'maj6', label: 'Major 6 (6)', match: (k) => {
    const q = k.split(':')[1] || '';
    return q === 'maj6' || q === '6';
  }},
  { id: 'min6', label: 'Minor 6 (m6)', match: (k) => (k.split(':')[1] || '') === 'min6' },
  { id: 'maj7', label: 'Major 7 (maj7)', match: (k) => (k.split(':')[1] || '') === 'maj7' },
  { id: 'min7', label: 'Minor 7 (m7)', match: (k) => (k.split(':')[1] || '') === 'min7' },
  { id: '7', label: 'Dominant 7 (7)', match: (k) => (k.split(':')[1] || '') === '7' },
  { id: 'minmaj7', label: 'Minor Major 7 (m(maj7))', match: (k) => (k.split(':')[1] || '') === 'minmaj7' },
  { id: 'dim7', label: 'Diminished 7 (dim7)', match: (k) => (k.split(':')[1] || '') === 'dim7' },
  { id: 'hdim7', label: 'Half-Dim 7 (m7♭5)', match: (k) => (k.split(':')[1] || '') === 'hdim7' },
  { id: 'sus2', label: 'Sus2', match: (k) => (k.split(':')[1] || '') === 'sus2' },
  { id: 'sus4', label: 'Sus4', match: (k) => {
    const q = k.split(':')[1] || '';
    return q === 'sus4' || q === 'sus';
  }},
];

const ROOT_OPTIONS = ['ALL', ...PITCH_CLASSES];

let currentFilters = {
  root: 'ALL',
  quality: 'all',
  searchQuery: '',
};

/**
 * Generate a standalone crisp SVG Fretboard for any voicing
 */
export function generateLibraryFretboardSvg(voicing, rootColor = '#6366f1') {
  if (!voicing || !voicing.frets) return '';

  const baseFret = voicing.baseFret || 1;
  const xOffset = 44;
  const yOffset = 38;
  const width = 110;
  const height = 135;
  const numStrings = 6;
  const numFrets = 5;
  const stringGap = width / (numStrings - 1);
  const fretGap = height / numFrets;

  let svg = `<svg viewBox="0 0 186 210" class="library-fretboard-svg">`;

  // Fretboard rect
  svg += `<rect x="${xOffset}" y="${yOffset}" width="${width}" height="${height}" fill="#0b101c" stroke="#334155" stroke-width="1.5" rx="3"/>`;

  // Base Fret Indicator or Nut
  if (baseFret === 1) {
    // Open Nut line
    svg += `<line x1="${xOffset - 1}" y1="${yOffset}" x2="${xOffset + width + 1}" y2="${yOffset}" stroke="#f8fafc" stroke-width="4.5" stroke-linecap="round"/>`;
  } else {
    // Glowing Base Fret Badge with clean margin from string 0
    svg += `
      <rect x="4" y="${yOffset + 3}" width="28" height="18" rx="4" fill="rgba(6, 182, 212, 0.2)" stroke="#38bdf8" stroke-width="1"/>
      <text x="18" y="${yOffset + 16}" fill="#38bdf8" font-size="10" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">${baseFret}fr</text>
    `;
  }

  // Horizontal Frets
  for (let f = 1; f <= numFrets; f++) {
    const fy = yOffset + f * fretGap;
    svg += `<line x1="${xOffset}" y1="${fy}" x2="${xOffset + width}" y2="${fy}" stroke="#334155" stroke-width="1.2"/>`;
  }

  // Vertical Strings & Note of each string at the bottom
  for (let s = 0; s < numStrings; s++) {
    const sx = xOffset + s * stringGap;
    svg += `<line x1="${sx}" y1="${yOffset}" x2="${sx}" y2="${yOffset + height}" stroke="#64748b" stroke-width="${s < 3 ? '2.2' : '1.4'}"/>`;

    const fret = voicing.frets ? voicing.frets[s] : -1;
    if (fret === -1) {
      svg += `<text x="${sx}" y="${yOffset + height + 16}" text-anchor="middle" fill="#64748b" font-size="10.5" font-weight="700" font-family="'JetBrains Mono', monospace">✕</text>`;
    } else {
      const pitchIdx = (OPEN_STRING_INDICES[s] + fret) % 12;
      const noteName = PITCH_CLASSES[pitchIdx];
      const noteCol = ROOT_COLORS[noteName] || '#38bdf8';
      svg += `<text x="${sx}" y="${yOffset + height + 16}" text-anchor="middle" fill="${noteCol}" font-size="11" font-weight="bold" font-family="'JetBrains Mono', monospace">${noteName}</text>`;
    }
  }

  // Barre Indicator
  if (voicing.barres && voicing.barres.length > 0) {
    voicing.barres.forEach(barreFret => {
      const relativeFret = barreFret - baseFret + 1;
      if (relativeFret >= 1 && relativeFret <= numFrets) {
        let minString = -1;
        let maxString = -1;
        voicing.frets.forEach((fret, sIdx) => {
          if (fret >= barreFret && fret !== -1) {
            if (minString === -1) minString = sIdx;
            maxString = sIdx;
          }
        });

        if (minString !== -1 && maxString > minString) {
          const cy = yOffset + (relativeFret - 0.5) * fretGap;
          const startX = xOffset + minString * stringGap - 5;
          const endX = xOffset + maxString * stringGap + 5;
          svg += `<rect x="${startX}" y="${cy - 7}" width="${endX - startX}" height="14" rx="7" fill="${rootColor}" opacity="0.88"/>`;
        }
      }
    });
  }

  // Finger Dots, Mutes, Opens
  voicing.frets.forEach((fret, sIdx) => {
    const cx = xOffset + sIdx * stringGap;
    if (fret === -1) {
      // Mute (X)
      svg += `<text x="${cx}" y="${yOffset - 10}" text-anchor="middle" fill="#f43f5e" font-size="12" font-weight="bold" font-family="'JetBrains Mono', monospace">✕</text>`;
    } else if (fret === 0) {
      // Open (O)
      svg += `<circle cx="${cx}" cy="${yOffset - 14}" r="4.5" fill="none" stroke="#10b981" stroke-width="1.8"/>`;
    } else {
      // Finger Dot
      const relativeFret = fret - baseFret + 1;
      if (relativeFret >= 1 && relativeFret <= numFrets) {
        const cy = yOffset + (relativeFret - 0.5) * fretGap;
        svg += `<circle cx="${cx}" cy="${cy}" r="6.8" fill="${rootColor}" stroke="#ffffff" stroke-width="1.5"/>`;
      }
    }
  });

  svg += `</svg>`;
  return svg;
}

/**
 * Initialize and render the entire Guitar Chord Library view
 */
export function initChordLibrary(containerId = 'chord-library-content') {
  const container = document.getElementById(containerId);
  if (!container) return;

  renderLibraryLayout(container);
  applyFiltersAndRender();
}

/**
 * Construct HTML skeleton for Guitar Chord Library
 */
function renderLibraryLayout(container) {
  // Compute total counts
  const totalChords = Object.keys(CHORD_ALTERNATIVES_DB).length;
  let totalVoicings = 0;
  Object.values(CHORD_ALTERNATIVES_DB).forEach(arr => { totalVoicings += arr.length; });

  container.innerHTML = `
    <div class="chord-library-wrapper">
      <!-- HERO HEADER & STATS -->
      <div class="library-hero-header">
        <div class="hero-header-text">
          <div class="library-badge-pill">🎸 CHORD_ALTERNATIVES_DB ENCYCLOPEDIA</div>
          <h2 class="library-main-title">Interactive Guitar Chord Library</h2>
          <p class="library-subtitle">
            Browse all <strong>${totalVoicings} guitar voicings</strong> across <strong>${totalChords} chords</strong> from <code>CHORD_ALTERNATIVES_DB</code>.
          </p>
        </div>

        <div class="library-stats-cards">
          <div class="stat-card">
            <span class="stat-num">${totalVoicings}</span>
            <span class="stat-label">Total Voicings</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">${totalChords}</span>
            <span class="stat-label">Chord Types</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">12</span>
            <span class="stat-label">Root Keys</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">⚡ Audio</span>
            <span class="stat-label">Plucked Strummer</span>
          </div>
        </div>
      </div>

      <!-- FILTER CONTROLS TOOLBAR -->
      <div class="library-filters-toolbar card">
        <!-- 1. Search Bar -->
        <div class="filter-search-group">
          <span class="search-icon">🔍</span>
          <input type="text" id="lib-search-input" class="lib-search-input" placeholder="Search chord (e.g. C, F#m, Cmaj7, 3fr)...">
          <button id="lib-search-clear" class="btn-clear-search" style="display: none;">✕</button>
        </div>

        <!-- 2. Root Note Filters (Chromatic 12 Keys) -->
        <div class="filter-section-row">
          <span class="filter-section-label">Root Note:</span>
          <div class="root-pills-scroll" id="lib-root-pills">
            <!-- Injected by JS -->
          </div>
        </div>

        <!-- 3. Chord Quality Family Filters -->
        <div class="filter-section-row">
          <span class="filter-section-label">Quality:</span>
          <div class="quality-pills-scroll" id="lib-quality-pills">
            <!-- Injected by JS -->
          </div>
        </div>
      </div>

      <!-- ACTIVE FILTERS SUMMARY BAR -->
      <div class="library-results-bar">
        <span id="lib-results-count" class="results-count-badge">Showing 0 chords</span>
        <button id="lib-reset-all-filters" class="btn btn-sm btn-ghost" style="display: none;">Reset Filters</button>
      </div>

      <!-- CHORDS DISPLAY GRID -->
      <div id="lib-chords-grid" class="library-chords-grid">
        <!-- Injected dynamically -->
      </div>
    </div>
  `;

  setupFilterEventListeners();
}

/**
 * Setup listeners for search, root, and quality buttons
 */
function setupFilterEventListeners() {
  const rootPillsContainer = document.getElementById('lib-root-pills');
  const qualityPillsContainer = document.getElementById('lib-quality-pills');
  const searchInput = document.getElementById('lib-search-input');
  const searchClear = document.getElementById('lib-search-clear');
  const btnReset = document.getElementById('lib-reset-all-filters');

  // 1. Root Pills
  if (rootPillsContainer) {
    rootPillsContainer.innerHTML = '';
    ROOT_OPTIONS.forEach(root => {
      const btn = document.createElement('button');
      btn.className = `lib-pill root-pill ${currentFilters.root === root ? 'active' : ''}`;
      btn.textContent = root;
      if (root !== 'ALL') {
        const col = ROOT_COLORS[root] || '#6366f1';
        btn.style.setProperty('--pill-color', col);
      }
      btn.addEventListener('click', () => {
        currentFilters.root = root;
        rootPillsContainer.querySelectorAll('.root-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFiltersAndRender();
      });
      rootPillsContainer.appendChild(btn);
    });
  }

  // 2. Quality Pills
  if (qualityPillsContainer) {
    qualityPillsContainer.innerHTML = '';
    QUALITY_GROUPS.forEach(q => {
      const btn = document.createElement('button');
      btn.className = `lib-pill quality-pill ${currentFilters.quality === q.id ? 'active' : ''}`;
      btn.textContent = q.label;
      btn.addEventListener('click', () => {
        currentFilters.quality = q.id;
        qualityPillsContainer.querySelectorAll('.quality-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFiltersAndRender();
      });
      qualityPillsContainer.appendChild(btn);
    });
  }

  // 3. Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.searchQuery = e.target.value.trim().toLowerCase();
      if (searchClear) searchClear.style.display = currentFilters.searchQuery ? 'block' : 'none';
      applyFiltersAndRender();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      currentFilters.searchQuery = '';
      searchClear.style.display = 'none';
      applyFiltersAndRender();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      currentFilters = { root: 'ALL', quality: 'all', searchQuery: '' };
      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.style.display = 'none';
      setupFilterEventListeners();
      applyFiltersAndRender();
    });
  }
}

/**
 * Filter chord database and render chord cards
 */
function applyFiltersAndRender() {
  const grid = document.getElementById('lib-chords-grid');
  const countBadge = document.getElementById('lib-results-count');
  const btnReset = document.getElementById('lib-reset-all-filters');
  if (!grid) return;

  const isFiltered = currentFilters.root !== 'ALL' || currentFilters.quality !== 'all' || !!currentFilters.searchQuery;
  if (btnReset) btnReset.style.display = isFiltered ? 'inline-flex' : 'none';

  const matchedChords = [];

  // Iterate over all entries in CHORD_ALTERNATIVES_DB
  Object.keys(CHORD_ALTERNATIVES_DB).forEach(chordKey => {
    const rawRoot = chordKey.split(':')[0];
    const normalizedKeyRoot = normalizeRoot(rawRoot);

    // Filter by Root Note
    if (currentFilters.root !== 'ALL' && normalizedKeyRoot !== currentFilters.root) {
      return;
    }

    // Filter by Quality
    if (currentFilters.quality !== 'all') {
      const qObj = QUALITY_GROUPS.find(g => g.id === currentFilters.quality);
      if (qObj && qObj.match && !qObj.match(chordKey)) {
        return;
      }
    }

    const voicingsList = CHORD_ALTERNATIVES_DB[chordKey] || [];

    // Filter Voicings by Search Query
    const filteredVoicings = voicingsList.filter(v => {
      if (currentFilters.searchQuery) {
        const query = currentFilters.searchQuery;
        const formatted = formatChordName(chordKey).toLowerCase();
        const tab = v.frets.map(f => f === -1 ? 'x' : f.toString()).join('-');
        const matchesKey = chordKey.toLowerCase().includes(query) || formatted.includes(query);
        const matchesName = (v.name || '').toLowerCase().includes(query);
        const matchesTab = tab.includes(query);
        const matchesFret = (v.baseFret && `${v.baseFret}fr`.includes(query)) || (v.barres && v.barres.some(b => `${b}fr`.includes(query)));
        if (!matchesKey && !matchesName && !matchesTab && !matchesFret) return false;
      }
      return true;
    });

    if (filteredVoicings.length > 0) {
      matchedChords.push({
        chordKey,
        root: normalizedKeyRoot,
        formattedName: formatChordName(chordKey),
        voicings: filteredVoicings,
        notes: getChordNotes(chordKey)
      });
    }
  });

  // Sort matched chords by chromatic root note and precise quality sequence
  matchedChords.sort((a, b) => {
    const rootIdxA = PITCH_CLASSES.indexOf(a.root);
    const rootIdxB = PITCH_CLASSES.indexOf(b.root);
    if (rootIdxA !== rootIdxB) return rootIdxA - rootIdxB;

    const qA = a.chordKey.includes(':') ? a.chordKey.split(':')[1] : '';
    const qB = b.chordKey.includes(':') ? b.chordKey.split(':')[1] : '';
    const orderA = QUALITY_ORDER.indexOf(qA) !== -1 ? QUALITY_ORDER.indexOf(qA) : 999;
    const orderB = QUALITY_ORDER.indexOf(qB) !== -1 ? QUALITY_ORDER.indexOf(qB) : 999;
    return orderA - orderB;
  });

  // Calculate total voicings matched
  let totalVoicingsMatched = 0;
  matchedChords.forEach(c => { totalVoicingsMatched += c.voicings.length; });

  if (countBadge) {
    countBadge.textContent = `Found ${matchedChords.length} chords (${totalVoicingsMatched} voicings)`;
  }

  if (matchedChords.length === 0) {
    grid.innerHTML = `
      <div class="empty-state-library card">
        <div class="empty-icon">🎸</div>
        <h3>No chords matched your filters</h3>
        <p>Try searching for a different chord (e.g. <code>C</code>, <code>Am</code>, <code>F#m7</code>) or clear the root / quality filters.</p>
        <button id="btn-clear-empty-filter" class="btn btn-sm btn-hero-action" style="margin-top: 14px;">Reset All Filters</button>
      </div>
    `;
    const btnClearEmpty = document.getElementById('btn-clear-empty-filter');
    if (btnClearEmpty) {
      btnClearEmpty.addEventListener('click', () => {
        currentFilters = { root: 'ALL', quality: 'all', searchQuery: '' };
        setupFilterEventListeners();
        applyFiltersAndRender();
      });
    }
    return;
  }

  grid.innerHTML = '';
  const frag = document.createDocumentFragment();

  matchedChords.forEach(chordEntry => {
    const rootColor = ROOT_COLORS[chordEntry.root] || '#6366f1';
    const sectionCard = document.createElement('div');
    sectionCard.className = 'library-chord-group-card card';

    // Group Header
    const notesStr = chordEntry.notes.length > 0 ? chordEntry.notes.join(' • ') : '';

    sectionCard.innerHTML = `
      <div class="chord-group-header">
        <div class="chord-group-title-area">
          <div class="chord-root-badge" style="background-color: ${rootColor}; color: #ffffff;">${chordEntry.root}</div>
          <div class="chord-group-names">
            <h3 class="chord-main-name" style="color: ${rootColor}">${chordEntry.formattedName}</h3>
            <span class="chord-key-code">Code: <code>${chordEntry.chordKey}</code></span>
          </div>
        </div>

        <div class="chord-group-meta-tags">
          ${notesStr ? `<span class="tag-notes" title="Harmonic notes">🎹 ${notesStr}</span>` : ''}
          <span class="tag-voicing-count">${chordEntry.voicings.length} ${chordEntry.voicings.length === 1 ? 'Voicing' : 'Voicings'}</span>
        </div>
      </div>

      <div class="chord-voicings-row">
        <!-- Voicing cards injected below -->
      </div>
    `;

    const voicingsRow = sectionCard.querySelector('.chord-voicings-row');

    chordEntry.voicings.forEach((voicing, vIdx) => {
      const vCard = document.createElement('div');
      vCard.className = 'library-voicing-card';
      const svg = generateLibraryFretboardSvg(voicing, rootColor);

      vCard.innerHTML = `
        <div class="voicing-svg-box">
          ${svg}
        </div>

        <div class="voicing-card-actions">
          <button class="btn btn-sm btn-strum-voicing" title="Listen to realistic plucked strum sound">
            <span class="strum-icon">▶</span>
            <span>Strum Audio</span>
          </button>
        </div>
      `;

      // Audio Strum handler
      const strumBtn = vCard.querySelector('.btn-strum-voicing');
      if (strumBtn) {
        strumBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          strumBtn.classList.add('strumming');
          playGuitarStrum(voicing.frets);
          setTimeout(() => strumBtn.classList.remove('strumming'), 1000);
        });
      }

      voicingsRow.appendChild(vCard);
    });

    frag.appendChild(sectionCard);
  });

  grid.appendChild(frag);
}

/**
 * Jump directly to a specific chord in the library from external components
 */
export function navigateToChordInLibrary(chordKey) {
  if (!chordKey || chordKey === 'N') return;
  const root = normalizeRoot(chordKey.split(':')[0]);
  currentFilters.root = root;
  currentFilters.searchQuery = chordKey;
  currentFilters.quality = 'all';

  const rootPills = document.getElementById('lib-root-pills');
  if (rootPills) {
    rootPills.querySelectorAll('.root-pill').forEach(btn => {
      btn.classList.toggle('active', btn.textContent === root);
    });
  }

  const searchInput = document.getElementById('lib-search-input');
  if (searchInput) {
    searchInput.value = chordKey;
  }

  applyFiltersAndRender();
}
