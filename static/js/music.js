/* =========================================================
   ChordVision — Musical Calculations & Transposition Logic
   ========================================================= */

import { PITCH_CLASSES, FLATS_TO_SHARPS, CHORD_INTERVALS, GUITAR_CHORDS_DB } from './constants.js';

export function normalizeRoot(root) {
  if (FLATS_TO_SHARPS[root]) return FLATS_TO_SHARPS[root];
  return root;
}

export function formatChordName(chordStr) {
  if (!chordStr || chordStr === 'N') return 'N';

  // Handle slash chords like C:7/E
  if (chordStr.includes('/')) {
    const slashParts = chordStr.split('/');
    return `${formatChordName(slashParts[0])}/${formatChordName(slashParts[1])}`;
  }

  if (chordStr.includes(':')) {
    const [root, quality] = chordStr.split(':');
    if (!quality || quality.toLowerCase() === 'maj') {
      return root;
    }
    const formattedQuality = quality.replace(/min/g, 'm');
    return root + formattedQuality;
  }

  return chordStr.replace(/min/g, 'm');
}

export function transposePitch(note, semitones) {
  if (!note || note === 'N') return 'N';
  const cleanNote = normalizeRoot(note);
  const idx = PITCH_CLASSES.indexOf(cleanNote);
  if (idx === -1) return note;
  const newIdx = (idx + semitones + 120) % 12;
  return PITCH_CLASSES[newIdx];
}

export function transposeChordName(chordStr, semitones) {
  if (!chordStr || chordStr === 'N') return 'N';
  if (semitones === 0) return chordStr;

  const parts = chordStr.split(':');
  let root = parts[0];
  let quality = parts.length > 1 ? ':' + parts.slice(1).join(':') : '';

  if (root.includes('/')) {
    const slashParts = root.split('/');
    const transposedMain = transposePitch(slashParts[0], semitones);
    const transposedBass = transposePitch(slashParts[1], semitones);
    return transposedMain + quality + '/' + transposedBass;
  }

  return transposePitch(root, semitones) + quality;
}

export function getChordNotes(chordStr) {
  if (!chordStr || chordStr === 'N') return [];
  
  let root = chordStr.split(':')[0].split('/')[0];
  root = normalizeRoot(root);
  const rootIdx = PITCH_CLASSES.indexOf(root);
  if (rootIdx === -1) return [];

  let quality = '';
  if (chordStr.includes(':')) {
    quality = chordStr.split(':')[1].split('/')[0].toLowerCase();
  }

  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS[''];
  return intervals.map(offset => PITCH_CLASSES[(rootIdx + offset) % 12]);
}

export function getGuitarChordShape(chordStr) {
  if (!chordStr || chordStr === 'N') return null;

  let cleanChord = chordStr;
  if (cleanChord.includes('/')) {
    cleanChord = cleanChord.split('/')[0];
  }

  // Direct match
  if (GUITAR_CHORDS_DB[cleanChord]) return GUITAR_CHORDS_DB[cleanChord];

  // Match normalized root
  const parts = cleanChord.split(':');
  const normRoot = normalizeRoot(parts[0]);
  const quality = parts.length > 1 ? ':' + parts[1] : '';
  const normName = normRoot + quality;

  if (GUITAR_CHORDS_DB[normName]) return GUITAR_CHORDS_DB[normName];

  // Fallbacks
  if (quality.includes('min') && GUITAR_CHORDS_DB[normRoot + ':min']) {
    return GUITAR_CHORDS_DB[normRoot + ':min'];
  }
  return null;
}

// Rate playability of a guitar chord shape (0 to 10)
export function getChordPlayabilityScore(chordStr) {
  if (!chordStr || chordStr === 'N') return 10;
  const shape = getGuitarChordShape(chordStr);
  if (!shape) return 1;

  const hasOpenStrings = shape.frets.some(f => f === 0);
  const isBarre = shape.barres && shape.barres.length > 0;
  const baseFret = shape.baseFret || 1;

  if (baseFret === 1 && hasOpenStrings && !isBarre) {
    return 10; // Open chords (C, G, D, Em, Am, E, A)
  }
  if (baseFret === 1 && !isBarre) {
    return 8; // Easy open-position chords (Dm, Fmaj7)
  }
  if (baseFret <= 3 && !isBarre) {
    return 6;
  }
  if (isBarre) {
    return 3; // Barre chords
  }
  return 4;
}

// Find best capo (0 to 7) for a chord progression
export function findBestCapo(chords) {
  if (!chords || !chords.length) {
    return { bestCapo: 0, bestScore: 0, openPercent: 0, recommendations: [] };
  }

  const recommendations = [];

  for (let capo = 0; capo <= 7; capo++) {
    let totalScore = 0;
    let easyCount = 0;
    let totalChords = 0;

    chords.forEach(c => {
      if (c.chord === 'N') return;
      totalChords++;
      const shapedChord = transposeChordName(c.chord, -capo);
      const score = getChordPlayabilityScore(shapedChord);
      totalScore += score;
      if (score >= 8) easyCount++;
    });

    const avgScore = totalChords > 0 ? (totalScore / totalChords) : 0;
    const openPercent = totalChords > 0 ? Math.round((easyCount / totalChords) * 100) : 0;

    recommendations.push({
      capo,
      score: avgScore,
      openPercent,
    });
  }

  // Sort by score descending (prefer lower capo if scores are close)
  const sorted = [...recommendations].sort((a, b) => b.score - a.score || a.capo - b.capo);
  const best = sorted[0];

  return {
    bestCapo: best.capo,
    bestScore: best.score,
    openPercent: best.openPercent,
    recommendations,
  };
}
