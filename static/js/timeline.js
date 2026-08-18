import { ROOT_COLORS, PITCH_CLASSES } from './constants.js';
import { normalizeRoot, getChordNotes, getGuitarChordShape, formatChordName, transposeChordName } from './music.js';

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTimePrecise(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00.00';
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2);
  return `${m}:${s.padStart(5, '0')}`;
}

// Generate Mini Guitar Fretboard SVG (Enlarged narrow 6 strings, 5 frets for all CAGED positions)
export function generateMiniGuitarSvg(chordInput, rootColor) {
  if (!chordInput || chordInput === 'N') {
    return `<div class="mini-rest-label">Rest</div>`;
  }

  const chordData = typeof chordInput === 'object' && chordInput.frets ? chordInput : getGuitarChordShape(chordInput);
  if (!chordData) {
    return `<div class="mini-rest-label">Custom</div>`;
  }

  const baseFret = chordData.baseFret || 1;

  const xOffset = 18;
  const yOffset = 15;
  const width = 54;
  const height = 66;
  const numStrings = 6;
  const numFrets = 5;
  const stringGap = width / (numStrings - 1);
  const fretGap = height / numFrets;

  let svg = `<svg viewBox="0 0 86 86" class="mini-fretboard-svg">`;

  // Base Fret indicator on the left
  if (baseFret > 1) {
    svg += `<text x="7" y="${yOffset + 10}" fill="#38bdf8" font-size="9.5" font-weight="bold" font-family="'JetBrains Mono', monospace" text-anchor="middle">${baseFret}</text>`;
  }

  // Fretboard rect
  svg += `<rect x="${xOffset}" y="${yOffset}" width="${width}" height="${height}" fill="#0a0f1d" stroke="#334155" stroke-width="1.2"/>`;

  // Nut line
  if (baseFret === 1) {
    svg += `<line x1="${xOffset - 1}" y1="${yOffset}" x2="${xOffset + width + 1}" y2="${yOffset}" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>`;
  }

  // Horizontal Frets
  for (let f = 1; f <= numFrets; f++) {
    svg += `<line x1="${xOffset}" y1="${yOffset + f * fretGap}" x2="${xOffset + width}" y2="${yOffset + f * fretGap}" stroke="#334155" stroke-width="1"/>`;
  }

  // Vertical Strings
  for (let s = 0; s < numStrings; s++) {
    const sx = xOffset + s * stringGap;
    svg += `<line x1="${sx}" y1="${yOffset}" x2="${sx}" y2="${yOffset + height}" stroke="#64748b" stroke-width="${s < 3 ? '1.5' : '1'}"/>`;
  }

  // Barre Indicator
  if (chordData.barres && chordData.barres.length > 0) {
    chordData.barres.forEach(barreFret => {
      const relativeFret = barreFret - baseFret + 1;
      if (relativeFret >= 1 && relativeFret <= numFrets) {
        let minString = -1;
        let maxString = -1;
        chordData.frets.forEach((fret, sIdx) => {
          if (fret >= barreFret && fret !== -1) {
            if (minString === -1) minString = sIdx;
            maxString = sIdx;
          }
        });

        if (minString !== -1 && maxString > minString) {
          const cy = yOffset + (relativeFret - 0.5) * fretGap;
          const startX = xOffset + minString * stringGap - 3;
          const endX = xOffset + maxString * stringGap + 3;
          svg += `<rect x="${startX}" y="${cy - 4.5}" width="${endX - startX}" height="9" rx="4.5" fill="${rootColor}" opacity="0.85"/>`;
        }
      }
    });
  }

  // Finger dots & Open / Mute symbols
  chordData.frets.forEach((fret, sIdx) => {
    const cx = xOffset + sIdx * stringGap;
    if (fret === -1) {
      // Mute (X)
      svg += `<text x="${cx}" y="${yOffset - 4}" text-anchor="middle" fill="#f43f5e" font-size="9" font-weight="bold" font-family="'JetBrains Mono', monospace">✕</text>`;
    } else if (fret === 0) {
      // Open (O)
      svg += `<circle cx="${cx}" cy="${yOffset - 5}" r="2.8" fill="none" stroke="#10b981" stroke-width="1.2"/>`;
    } else {
      // Finger Dot
      const relativeFret = fret - baseFret + 1;
      if (relativeFret >= 1 && relativeFret <= numFrets) {
        const cy = yOffset + (relativeFret - 0.5) * fretGap;
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="${rootColor}" stroke="#ffffff" stroke-width="1"/>`;
      }
    }
  });

  svg += `</svg>`;
  return svg;
}

// Generate Mini Piano Keyboard SVG (1 Octave C to B)
function generateMiniPianoSvg(chordStr, rootColor) {
  if (!chordStr || chordStr === 'N') {
    return `<div class="mini-rest-label">Rest</div>`;
  }

  const chordNotes = getChordNotes(chordStr);
  const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeys = [
    { note: 'C#', x: 8.5 },
    { note: 'D#', x: 20.5 },
    { note: 'F#', x: 44.5 },
    { note: 'G#', x: 56.5 },
    { note: 'A#', x: 68.5 },
  ];

  const whiteKeyWidth = 12;
  const whiteKeyHeight = 46;
  const blackKeyWidth = 8;
  const blackKeyHeight = 28;

  let svg = `<svg viewBox="0 0 88 50" class="mini-piano-svg">`;

  // Draw 7 White Keys
  whiteNotes.forEach((note, idx) => {
    const x = idx * whiteKeyWidth + 3;
    const isActive = chordNotes.includes(note);
    const fill = isActive ? rootColor : '#f1f5f9';
    const stroke = isActive ? '#6366f1' : '#cbd5e1';

    svg += `<rect x="${x}" y="5" width="${whiteKeyWidth - 1}" height="${whiteKeyHeight}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="0.8"/>`;
    if (isActive) {
      svg += `<circle cx="${x + (whiteKeyWidth - 1) / 2}" cy="${whiteKeyHeight - 6}" r="2" fill="#ffffff"/>`;
    }
  });

  // Draw 5 Black Keys
  blackKeys.forEach(bk => {
    const isActive = chordNotes.includes(bk.note);
    const fill = isActive ? '#38bdf8' : '#1e293b';
    const stroke = isActive ? '#ffffff' : '#0f172a';

    svg += `<rect x="${bk.x + 2}" y="5" width="${blackKeyWidth}" height="${blackKeyHeight}" rx="1.5" fill="${fill}" stroke="${stroke}" stroke-width="0.8"/>`;
    if (isActive) {
      svg += `<circle cx="${bk.x + 2 + blackKeyWidth / 2}" cy="${blackKeyHeight - 4}" r="1.5" fill="#ffffff"/>`;
    }
  });

  svg += `</svg>`;
  return svg;
}

export function renderUnifiedTimeline(container, chords, onCardClick, capoFret = 0) {
  if (!container) return;
  container.innerHTML = '';

  if (!chords || !chords.length) {
    container.innerHTML = '<div class="empty-state">No chord segments found.</div>';
    return;
  }

  const frag = document.createDocumentFragment();

  chords.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'timeline-chord-card';
    card.id = `chord-card-${index}`;
    card.dataset.index = index;
    card.dataset.start = item.start;
    card.dataset.end = item.end;

    // When Capo is active, guitar displays easier transposed finger shapes and chord shape name
    const effectiveGuitarChord = capoFret > 0 && item.chord !== 'N' ? transposeChordName(item.chord, -capoFret) : item.chord;
    card.dataset.chord = effectiveGuitarChord.toLowerCase();

    const root = effectiveGuitarChord === 'N' ? 'N' : normalizeRoot(effectiveGuitarChord.split(':')[0]);
    const rootColor = ROOT_COLORS[root] || '#6366f1';

    const miniGuitarHtml = generateMiniGuitarSvg(effectiveGuitarChord, rootColor);
    const miniPianoHtml = generateMiniPianoSvg(item.chord, rootColor);
    const displayName = formatChordName(effectiveGuitarChord);

    card.innerHTML = `
      <div class="chord-top-bar" style="background: ${rootColor}"></div>
      <div class="card-chord-name" style="color: ${effectiveGuitarChord === 'N' ? '#94a3b8' : '#ffffff'}">${displayName}</div>
      <div class="card-visual-container">
        <div class="card-mini-guitar">${miniGuitarHtml}</div>
        <div class="card-mini-piano">${miniPianoHtml}</div>
      </div>
      <div class="card-chord-bottom">
        <div class="card-chord-dur">${item.duration.toFixed(1)}s</div>
      </div>
    `;

    card.addEventListener('click', () => {
      if (onCardClick) onCardClick(item, index);
    });

    frag.appendChild(card);
  });

  container.appendChild(frag);
}

export function renderUpcomingChords(container, upcomingList, capoFret = 0) {
  if (!container) return;
  container.innerHTML = '';
  if (!upcomingList || !upcomingList.length) {
    return;
  }

  const frag = document.createDocumentFragment();
  upcomingList.forEach(item => {
    const chip = document.createElement('span');
    chip.className = 'upcoming-chip';
    const effectiveChord = capoFret > 0 && item.chord !== 'N' ? transposeChordName(item.chord, -capoFret) : item.chord;
    const root = effectiveChord === 'N' ? 'N' : normalizeRoot(effectiveChord.split(':')[0]);
    chip.style.borderColor = ROOT_COLORS[root] || 'transparent';
    chip.textContent = formatChordName(effectiveChord);
    frag.appendChild(chip);
  });
  container.appendChild(frag);
}
