/* =========================================================
   ChordVision — Musical Calculations & Transposition Logic
   ========================================================= */

import { PITCH_CLASSES, FLATS_TO_SHARPS, CHORD_INTERVALS, GUITAR_CHORDS_DB, CHORD_ALTERNATIVES_DB } from './constants.js';

export function normalizeRoot(root) {
  if (!root || typeof root !== 'string') return '';
  const trimmed = root.trim();
  if (!trimmed) return '';
  const standard = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  if (FLATS_TO_SHARPS[standard]) return FLATS_TO_SHARPS[standard];
  if (FLATS_TO_SHARPS[trimmed]) return FLATS_TO_SHARPS[trimmed];
  return standard;
}

/**
 * Universal Chord Parser
 * Parses any chord format (e.g. "Dm", "D:min", "Dmin7", "F#m7", "Bb", "C:maj7", "G/B")
 * into normalized { root, quality, bass, canonical }.
 */
export function parseChord(chordStr) {
  if (!chordStr || chordStr === 'N' || typeof chordStr !== 'string') {
    return { root: 'N', quality: '', bass: null, canonical: 'N' };
  }

  let clean = chordStr.trim();
  let bass = null;
  if (clean.includes('/')) {
    const slashParts = clean.split('/');
    clean = slashParts[0].trim();
    bass = normalizeRoot(slashParts[1]);
  }

  let root = '';
  let quality = '';

  if (clean.includes(':')) {
    const parts = clean.split(':');
    root = normalizeRoot(parts[0]);
    quality = (parts[1] || '').toLowerCase().trim();
  } else {
    // 2-character root pitches first (C#, Db, D#, Eb, F#, Gb, G#, Ab, A#, Bb), then 1-character
    const rootsRegex = /^(C#|Db|D#|Eb|F#|Gb|G#|Ab|A#|Bb|[CDEFGAB])/i;
    const match = clean.match(rootsRegex);
    if (match) {
      root = normalizeRoot(match[1].toUpperCase());
      quality = clean.slice(match[1].length).toLowerCase().trim();
    } else {
      root = clean;
      quality = '';
    }
  }

  // Normalize all quality aliases to standard canonical notation
  if (quality === 'm' || quality === 'min' || quality === 'minor') quality = 'min';
  else if (quality === 'm7' || quality === 'min7' || quality === 'minor7') quality = 'min7';
  else if (quality === 'maj' || quality === 'major' || quality === 'm' && quality === 'maj') quality = '';
  else if (quality === 'maj7' || quality === 'major7' || quality === 'm7+' || quality === 'm7maj') quality = 'maj7';
  else if (quality === '7' || quality === 'dom7' || quality === 'dominant7') quality = '7';
  else if (quality === 'sus' || quality === 'sus4') quality = 'sus4';
  else if (quality === 'sus2') quality = 'sus2';
  else if (quality === 'dim' || quality === 'diminished') quality = 'dim';
  else if (quality === 'dim7') quality = 'dim7';
  else if (quality === 'hdim7' || quality === 'm7b5' || quality === 'half-dim') quality = 'hdim7';
  else if (quality === 'aug' || quality === 'augmented') quality = 'aug';
  else if (quality === '6' || quality === 'maj6') quality = 'maj6';
  else if (quality === 'm6' || quality === 'min6') quality = 'min6';
  else if (quality === 'minmaj7' || quality === 'mmaj7' || quality === 'm(maj7)') quality = 'minmaj7';
  else if (quality === 'add9' || quality === '9') quality = 'add9';

  const canonical = quality ? `${root}:${quality}` : root;
  return { root, quality, bass, canonical };
}

export function formatChordName(chordStr) {
  if (!chordStr || chordStr === 'N') return 'N';
  if (typeof chordStr !== 'string') return typeof chordStr === 'object' && chordStr.name ? chordStr.name : String(chordStr);

  const { root, quality, bass } = parseChord(chordStr);
  if (root === 'N') return 'N';

  let displayQuality = '';
  if (quality === 'min') displayQuality = 'm';
  else if (quality === 'min7') displayQuality = 'm7';
  else if (quality === 'maj7') displayQuality = 'maj7';
  else if (quality === '7') displayQuality = '7';
  else if (quality === 'hdim7') displayQuality = 'ø7';
  else if (quality === 'minmaj7') displayQuality = 'm(maj7)';
  else if (quality === 'maj6' || quality === '6') displayQuality = '6';
  else if (quality === 'min6') displayQuality = 'm6';
  else if (quality === 'sus4') displayQuality = 'sus4';
  else if (quality === 'sus2') displayQuality = 'sus2';
  else if (quality === 'dim') displayQuality = 'dim';
  else if (quality === 'dim7') displayQuality = 'dim7';
  else if (quality === 'aug') displayQuality = 'aug';
  else if (quality) displayQuality = quality.replace(/min/g, 'm');

  const baseName = root + displayQuality;
  return bass ? `${baseName}/${bass}` : baseName;
}

export function transposePitch(note, semitones) {
  if (!note || note === 'N' || typeof note !== 'string') return 'N';
  const cleanNote = normalizeRoot(note);
  const idx = PITCH_CLASSES.indexOf(cleanNote);
  if (idx === -1) return note;
  const newIdx = (idx + semitones + 120) % 12;
  return PITCH_CLASSES[newIdx];
}

export function transposeChordName(chordStr, semitones) {
  if (!chordStr || chordStr === 'N') return 'N';
  if (typeof chordStr !== 'string') return String(chordStr);
  if (semitones === 0) return chordStr;

  const { root, quality, bass } = parseChord(chordStr);
  if (root === 'N') return 'N';

  const newRoot = transposePitch(root, semitones);
  const qualityStr = quality ? (chordStr.includes(':') ? `:${quality}` : quality) : '';
  const newBass = bass ? `/${transposePitch(bass, semitones)}` : '';

  return newRoot + qualityStr + newBass;
}

export function getChordNotes(chordStr) {
  if (!chordStr || chordStr === 'N' || typeof chordStr !== 'string') return [];

  const { root, quality } = parseChord(chordStr);
  const rootIdx = PITCH_CLASSES.indexOf(root);
  if (rootIdx === -1) return [];

  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS[''];
  return intervals.map(offset => PITCH_CLASSES[(rootIdx + offset) % 12]);
}

export function getGuitarChordShape(chordInput) {
  if (!chordInput || chordInput === 'N') return null;
  if (typeof chordInput === 'object' && chordInput.frets) return chordInput;
  if (typeof chordInput !== 'string') return null;

  const { root, quality, canonical } = parseChord(chordInput);
  if (root === 'N') return null;

  // 1. Direct canonical lookup in GUITAR_CHORDS_DB
  if (GUITAR_CHORDS_DB[canonical]) return GUITAR_CHORDS_DB[canonical];

  // 2. Direct lookup in CHORD_ALTERNATIVES_DB (340+ shapes)
  if (CHORD_ALTERNATIVES_DB[canonical] && CHORD_ALTERNATIVES_DB[canonical].length > 0) {
    return CHORD_ALTERNATIVES_DB[canonical][0];
  }
  if (CHORD_ALTERNATIVES_DB[chordInput] && CHORD_ALTERNATIVES_DB[chordInput].length > 0) {
    return CHORD_ALTERNATIVES_DB[chordInput][0];
  }

  // 3. Fallback to common variants in GUITAR_CHORDS_DB
  if (quality.includes('min') && GUITAR_CHORDS_DB[`${root}:min`]) {
    return GUITAR_CHORDS_DB[`${root}:min`];
  }
  if (quality.includes('maj7') && GUITAR_CHORDS_DB[`${root}:maj7`]) {
    return GUITAR_CHORDS_DB[`${root}:maj7`];
  }
  if (quality.includes('7') && GUITAR_CHORDS_DB[`${root}:7`]) {
    return GUITAR_CHORDS_DB[`${root}:7`];
  }
  if (quality.includes('sus') && GUITAR_CHORDS_DB[`${root}:sus4`]) {
    return GUITAR_CHORDS_DB[`${root}:sus4`];
  }

  // 4. Fallback to basic Root triad in GUITAR_CHORDS_DB or CHORD_ALTERNATIVES_DB
  if (GUITAR_CHORDS_DB[root]) {
    return GUITAR_CHORDS_DB[root];
  }
  if (CHORD_ALTERNATIVES_DB[root] && CHORD_ALTERNATIVES_DB[root].length > 0) {
    return CHORD_ALTERNATIVES_DB[root][0];
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

// Get Alternative & Easier Chord Voicings
export function getChordAlternatives(chordStr, capoFret = 0) {
  if (!chordStr || chordStr === 'N') return [];

  const effectiveChord = capoFret > 0 ? transposeChordName(chordStr, -capoFret) : chordStr;
  const { root, quality, canonical } = parseChord(effectiveChord);
  if (root === 'N') return [];

  // Direct matches in alternatives DB
  if (CHORD_ALTERNATIVES_DB[canonical] && CHORD_ALTERNATIVES_DB[canonical].length > 0) {
    return CHORD_ALTERNATIVES_DB[canonical];
  }
  if (CHORD_ALTERNATIVES_DB[effectiveChord] && CHORD_ALTERNATIVES_DB[effectiveChord].length > 0) {
    return CHORD_ALTERNATIVES_DB[effectiveChord];
  }

  // Fallback to min/maj family in alternatives DB
  if (quality.includes('min') && CHORD_ALTERNATIVES_DB[`${root}:min`]) {
    return CHORD_ALTERNATIVES_DB[`${root}:min`];
  }
  if (CHORD_ALTERNATIVES_DB[root]) {
    return CHORD_ALTERNATIVES_DB[root];
  }

  // If primary database has a shape, wrap it as a single alternative
  const mainShape = getGuitarChordShape(effectiveChord);
  if (mainShape) {
    return [{ name: formatChordName(effectiveChord), ...mainShape }];
  }

  return [];
}
