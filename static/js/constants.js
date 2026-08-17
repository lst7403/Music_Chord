/* =========================================================
   ChordVision — Musical Constants & Databases
   ========================================================= */

export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const FLATS_TO_SHARPS = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

export const ROOT_COLORS = {
  'C': '#6366f1', 'C#': '#8b5cf6', 'D': '#ec4899', 'D#': '#f43f5e',
  'E': '#f97316', 'F': '#eab308', 'F#': '#84cc16', 'G': '#10b981',
  'G#': '#06b6d4', 'A': '#0284c7', 'A#': '#3b82f6', 'B': '#4f46e5',
  'N': '#475569'
};

export const CHORD_INTERVALS = {
  '': [0, 4, 7],           // Major
  'maj': [0, 4, 7],        // Major
  'min': [0, 3, 7],        // Minor
  'dim': [0, 3, 6],        // Diminished
  'aug': [0, 4, 8],        // Augmented
  'maj6': [0, 4, 7, 9],    // Major 6
  '6': [0, 4, 7, 9],
  'min6': [0, 3, 7, 9],    // Minor 6
  'maj7': [0, 4, 7, 11],   // Major 7
  'min7': [0, 3, 7, 10],   // Minor 7
  '7': [0, 4, 7, 10],      // Dominant 7
  'minmaj7': [0, 3, 7, 11],// Minor Major 7
  'dim7': [0, 3, 6, 9],    // Diminished 7
  'hdim7': [0, 3, 6, 10],  // Half-diminished (m7b5)
  'sus2': [0, 2, 7],       // Sus2
  'sus4': [0, 5, 7],       // Sus4
  'sus': [0, 5, 7],        // Sus
};

// Guitar chord voicings (14 chord types across all 12 root pitch classes)
export const GUITAR_CHORDS_DB = {
  // C Family
  "C": { frets: [-1, 3, 2, 0, 1, 0], baseFret: 1, barres: [] },
  "C:min": { frets: [-1, 3, 5, 5, 4, 3], baseFret: 3, barres: [3] },
  "C:dim": { frets: [-1, 3, 4, 5, 4, -1], baseFret: 3, barres: [] },
  "C:aug": { frets: [-1, 3, 2, 1, 1, 0], baseFret: 1, barres: [] },
  "C:maj6": { frets: [-1, 3, 2, 2, 1, 0], baseFret: 1, barres: [] },
  "C:min6": { frets: [-1, 3, 1, 2, 1, -1], baseFret: 1, barres: [] },
  "C:maj7": { frets: [-1, 3, 2, 0, 0, 0], baseFret: 1, barres: [] },
  "C:min7": { frets: [-1, 3, 5, 3, 4, 3], baseFret: 3, barres: [3] },
  "C:7": { frets: [-1, 3, 2, 3, 1, 0], baseFret: 1, barres: [] },
  "C:minmaj7": { frets: [-1, 3, 5, 4, 4, 3], baseFret: 3, barres: [3] },
  "C:dim7": { frets: [-1, 3, 4, 2, 4, -1], baseFret: 1, barres: [] },
  "C:hdim7": { frets: [-1, 3, 4, 3, 4, -1], baseFret: 2, barres: [] },
  "C:sus2": { frets: [-1, 3, 0, 0, 3, 3], baseFret: 1, barres: [] },
  "C:sus4": { frets: [-1, 3, 3, 0, 1, 1], baseFret: 1, barres: [] },

  // C# / Db Family
  "C#": { frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barres: [4] },
  "C#:min": { frets: [-1, 4, 6, 6, 5, 4], baseFret: 4, barres: [4] },
  "C#:dim": { frets: [-1, 4, 5, 6, 5, -1], baseFret: 4, barres: [] },
  "C#:aug": { frets: [-1, 4, 3, 2, 2, -1], baseFret: 2, barres: [] },
  "C#:maj6": { frets: [-1, 4, 3, 3, 2, -1], baseFret: 2, barres: [] },
  "C#:min6": { frets: [-1, 4, 2, 3, 2, -1], baseFret: 2, barres: [] },
  "C#:maj7": { frets: [-1, 4, 6, 5, 6, 4], baseFret: 4, barres: [4] },
  "C#:min7": { frets: [-1, 4, 6, 4, 5, 4], baseFret: 4, barres: [4] },
  "C#:7": { frets: [-1, 4, 6, 4, 6, 4], baseFret: 4, barres: [4] },
  "C#:minmaj7": { frets: [-1, 4, 6, 5, 5, 4], baseFret: 4, barres: [4] },
  "C#:dim7": { frets: [-1, 4, 5, 3, 5, -1], baseFret: 3, barres: [] },
  "C#:hdim7": { frets: [-1, 4, 5, 4, 5, -1], baseFret: 4, barres: [] },
  "C#:sus2": { frets: [-1, 4, 6, 6, 4, 4], baseFret: 4, barres: [4] },
  "C#:sus4": { frets: [-1, 4, 6, 6, 7, 4], baseFret: 4, barres: [4] },

  // D Family
  "D": { frets: [-1, -1, 0, 2, 3, 2], baseFret: 1, barres: [] },
  "D:min": { frets: [-1, -1, 0, 2, 3, 1], baseFret: 1, barres: [] },
  "D:dim": { frets: [-1, -1, 0, 1, 3, 1], baseFret: 1, barres: [] },
  "D:aug": { frets: [-1, -1, 0, 3, 3, 2], baseFret: 1, barres: [] },
  "D:maj6": { frets: [-1, -1, 0, 2, 0, 2], baseFret: 1, barres: [] },
  "D:min6": { frets: [-1, -1, 0, 2, 0, 1], baseFret: 1, barres: [] },
  "D:maj7": { frets: [-1, -1, 0, 2, 2, 2], baseFret: 1, barres: [2] },
  "D:min7": { frets: [-1, -1, 0, 2, 1, 1], baseFret: 1, barres: [] },
  "D:7": { frets: [-1, -1, 0, 2, 1, 2], baseFret: 1, barres: [] },
  "D:minmaj7": { frets: [-1, -1, 0, 2, 2, 1], baseFret: 1, barres: [] },
  "D:dim7": { frets: [-1, -1, 0, 1, 0, 1], baseFret: 1, barres: [] },
  "D:hdim7": { frets: [-1, -1, 0, 1, 1, 1], baseFret: 1, barres: [1] },
  "D:sus2": { frets: [-1, -1, 0, 2, 3, 0], baseFret: 1, barres: [] },
  "D:sus4": { frets: [-1, -1, 0, 2, 3, 3], baseFret: 1, barres: [] },

  // D# / Eb Family
  "D#": { frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barres: [6] },
  "D#:min": { frets: [-1, 6, 8, 8, 7, 6], baseFret: 6, barres: [6] },
  "D#:dim": { frets: [-1, 6, 7, 8, 7, -1], baseFret: 6, barres: [] },
  "D#:aug": { frets: [-1, -1, 1, 0, 0, 3], baseFret: 1, barres: [] },
  "D#:maj6": { frets: [-1, 6, 5, 5, 4, -1], baseFret: 4, barres: [] },
  "D#:min6": { frets: [-1, 6, 4, 5, 4, -1], baseFret: 4, barres: [] },
  "D#:maj7": { frets: [-1, 6, 8, 7, 8, 6], baseFret: 6, barres: [6] },
  "D#:min7": { frets: [-1, 6, 8, 6, 7, 6], baseFret: 6, barres: [6] },
  "D#:7": { frets: [-1, 6, 8, 6, 8, 6], baseFret: 6, barres: [6] },
  "D#:minmaj7": { frets: [-1, 6, 8, 7, 7, 6], baseFret: 6, barres: [6] },
  "D#:dim7": { frets: [-1, 6, 7, 5, 7, -1], baseFret: 5, barres: [] },
  "D#:hdim7": { frets: [-1, 6, 7, 6, 7, -1], baseFret: 6, barres: [] },
  "D#:sus2": { frets: [-1, 6, 8, 8, 6, 6], baseFret: 6, barres: [6] },
  "D#:sus4": { frets: [-1, 6, 8, 8, 9, 6], baseFret: 6, barres: [6] },

  // E Family
  "E": { frets: [0, 2, 2, 1, 0, 0], baseFret: 1, barres: [] },
  "E:min": { frets: [0, 2, 2, 0, 0, 0], baseFret: 1, barres: [] },
  "E:dim": { frets: [-1, -1, 2, 3, 5, 3], baseFret: 2, barres: [] },
  "E:aug": { frets: [0, 3, 2, 1, 1, 0], baseFret: 1, barres: [] },
  "E:maj6": { frets: [0, 2, 2, 1, 2, 0], baseFret: 1, barres: [] },
  "E:min6": { frets: [0, 2, 2, 0, 2, 0], baseFret: 1, barres: [] },
  "E:maj7": { frets: [0, 2, 1, 1, 0, 0], baseFret: 1, barres: [] },
  "E:min7": { frets: [0, 2, 2, 0, 3, 0], baseFret: 1, barres: [] },
  "E:7": { frets: [0, 2, 0, 1, 0, 0], baseFret: 1, barres: [] },
  "E:minmaj7": { frets: [0, 2, 1, 0, 0, 0], baseFret: 1, barres: [] },
  "E:dim7": { frets: [0, 1, 2, 0, 2, 0], baseFret: 1, barres: [] },
  "E:hdim7": { frets: [0, 1, 0, 0, 3, 0], baseFret: 1, barres: [] },
  "E:sus2": { frets: [-1, 2, 4, 4, 5, 2], baseFret: 2, barres: [2] },
  "E:sus4": { frets: [0, 2, 2, 2, 0, 0], baseFret: 1, barres: [] },

  // F Family
  "F": { frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barres: [1] },
  "F:min": { frets: [1, 3, 3, 1, 1, 1], baseFret: 1, barres: [1] },
  "F:dim": { frets: [-1, -1, 3, 4, 6, 4], baseFret: 3, barres: [] },
  "F:aug": { frets: [-1, -1, 3, 2, 2, 1], baseFret: 1, barres: [] },
  "F:maj6": { frets: [1, 3, 0, 2, 1, 1], baseFret: 1, barres: [1] },
  "F:min6": { frets: [-1, -1, 0, 1, 1, 1], baseFret: 1, barres: [] },
  "F:maj7": { frets: [-1, -1, 3, 2, 1, 0], baseFret: 1, barres: [] },
  "F:min7": { frets: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1] },
  "F:7": { frets: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1] },
  "F:minmaj7": { frets: [1, 3, 2, 1, 1, 1], baseFret: 1, barres: [1] },
  "F:dim7": { frets: [-1, -1, 0, 1, 0, 1], baseFret: 1, barres: [] },
  "F:hdim7": { frets: [1, -1, 1, 1, 0, -1], baseFret: 1, barres: [] },
  "F:sus2": { frets: [-1, -1, 3, 0, 1, 1], baseFret: 1, barres: [] },
  "F:sus4": { frets: [1, 3, 3, 3, 1, 1], baseFret: 1, barres: [1] },

  // F# / Gb Family
  "F#": { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barres: [2] },
  "F#:min": { frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barres: [2] },
  "F#:dim": { frets: [2, 3, 4, 2, -1, -1], baseFret: 2, barres: [] },
  "F#:aug": { frets: [-1, -1, 4, 3, 3, 2], baseFret: 2, barres: [] },
  "F#:maj6": { frets: [2, 4, 1, 3, 2, 2], baseFret: 1, barres: [] },
  "F#:min6": { frets: [2, 4, 1, 2, 2, 2], baseFret: 1, barres: [] },
  "F#:maj7": { frets: [2, 4, 3, 3, 2, 2], baseFret: 2, barres: [2] },
  "F#:min7": { frets: [2, 4, 2, 2, 2, 2], baseFret: 2, barres: [2] },
  "F#:7": { frets: [2, 4, 2, 3, 2, 2], baseFret: 2, barres: [2] },
  "F#:minmaj7": { frets: [2, 4, 3, 2, 2, 2], baseFret: 2, barres: [2] },
  "F#:dim7": { frets: [2, -1, 1, 2, 1, -1], baseFret: 1, barres: [] },
  "F#:hdim7": { frets: [2, -1, 2, 2, 1, -1], baseFret: 1, barres: [] },
  "F#:sus2": { frets: [-1, -1, 4, 1, 2, 2], baseFret: 1, barres: [] },
  "F#:sus4": { frets: [2, 4, 4, 4, 2, 2], baseFret: 2, barres: [2] },

  // G Family
  "G": { frets: [3, 2, 0, 0, 0, 3], baseFret: 1, barres: [] },
  "G:min": { frets: [3, 5, 5, 3, 3, 3], baseFret: 3, barres: [3] },
  "G:dim": { frets: [3, 4, 5, 3, -1, -1], baseFret: 3, barres: [] },
  "G:aug": { frets: [3, 2, 1, 0, 0, 3], baseFret: 1, barres: [] },
  "G:maj6": { frets: [3, 2, 0, 0, 0, 0], baseFret: 1, barres: [] },
  "G:min6": { frets: [3, 1, 0, 0, 3, 0], baseFret: 1, barres: [] },
  "G:maj7": { frets: [3, 2, 0, 0, 0, 2], baseFret: 1, barres: [] },
  "G:min7": { frets: [3, 5, 3, 3, 3, 3], baseFret: 3, barres: [3] },
  "G:7": { frets: [3, 2, 0, 0, 0, 1], baseFret: 1, barres: [] },
  "G:minmaj7": { frets: [3, 5, 4, 3, 3, 3], baseFret: 3, barres: [3] },
  "G:dim7": { frets: [3, -1, 2, 3, 2, -1], baseFret: 2, barres: [] },
  "G:hdim7": { frets: [3, -1, 3, 3, 2, -1], baseFret: 2, barres: [] },
  "G:sus2": { frets: [3, 0, 0, 0, 3, 3], baseFret: 1, barres: [] },
  "G:sus4": { frets: [3, 3, 0, 0, 1, 3], baseFret: 1, barres: [] },

  // G# / Ab Family
  "G#": { frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barres: [4] },
  "G#:min": { frets: [4, 6, 6, 4, 4, 4], baseFret: 4, barres: [4] },
  "G#:dim": { frets: [4, 5, 6, 4, -1, -1], baseFret: 4, barres: [] },
  "G#:aug": { frets: [-1, -1, 2, 1, 1, 0], baseFret: 1, barres: [] },
  "G#:maj6": { frets: [4, 6, 3, 5, 4, 4], baseFret: 3, barres: [] },
  "G#:min6": { frets: [4, 6, 3, 4, 4, 4], baseFret: 3, barres: [] },
  "G#:maj7": { frets: [4, 6, 5, 5, 4, 4], baseFret: 4, barres: [4] },
  "G#:min7": { frets: [4, 6, 4, 4, 4, 4], baseFret: 4, barres: [4] },
  "G#:7": { frets: [4, 6, 4, 5, 4, 4], baseFret: 4, barres: [4] },
  "G#:minmaj7": { frets: [4, 6, 5, 4, 4, 4], baseFret: 4, barres: [4] },
  "G#:dim7": { frets: [4, -1, 3, 4, 3, -1], baseFret: 3, barres: [] },
  "G#:hdim7": { frets: [4, -1, 4, 4, 3, -1], baseFret: 3, barres: [] },
  "G#:sus2": { frets: [4, 6, 6, 3, 4, 4], baseFret: 3, barres: [] },
  "G#:sus4": { frets: [4, 6, 6, 6, 4, 4], baseFret: 4, barres: [4] },

  // A Family
  "A": { frets: [-1, 0, 2, 2, 2, 0], baseFret: 1, barres: [] },
  "A:min": { frets: [-1, 0, 2, 2, 1, 0], baseFret: 1, barres: [] },
  "A:dim": { frets: [-1, 0, 1, 2, 1, -1], baseFret: 1, barres: [] },
  "A:aug": { frets: [-1, 0, 3, 2, 2, 1], baseFret: 1, barres: [] },
  "A:maj6": { frets: [-1, 0, 2, 2, 2, 2], baseFret: 1, barres: [2] },
  "A:min6": { frets: [-1, 0, 2, 2, 1, 2], baseFret: 1, barres: [] },
  "A:maj7": { frets: [-1, 0, 2, 1, 2, 0], baseFret: 1, barres: [] },
  "A:min7": { frets: [-1, 0, 2, 0, 1, 0], baseFret: 1, barres: [] },
  "A:7": { frets: [-1, 0, 2, 0, 2, 0], baseFret: 1, barres: [] },
  "A:minmaj7": { frets: [-1, 0, 2, 1, 1, 0], baseFret: 1, barres: [] },
  "A:dim7": { frets: [-1, 0, 1, 2, 1, 2], baseFret: 1, barres: [] },
  "A:hdim7": { frets: [-1, 0, 1, 0, 1, -1], baseFret: 1, barres: [] },
  "A:sus2": { frets: [-1, 0, 2, 2, 0, 0], baseFret: 1, barres: [] },
  "A:sus4": { frets: [-1, 0, 2, 2, 3, 0], baseFret: 1, barres: [] },

  // A# / Bb Family
  "A#": { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  "A#:min": { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barres: [1] },
  "A#:dim": { frets: [-1, 1, 2, 3, 2, -1], baseFret: 1, barres: [] },
  "A#:aug": { frets: [-1, 1, 0, 3, 3, 2], baseFret: 1, barres: [] },
  "A#:maj6": { frets: [-1, 1, 3, 3, 3, 3], baseFret: 1, barres: [3] },
  "A#:min6": { frets: [-1, 1, 3, 3, 2, 3], baseFret: 1, barres: [] },
  "A#:maj7": { frets: [-1, 1, 3, 2, 3, 1], baseFret: 1, barres: [1] },
  "A#:min7": { frets: [-1, 1, 3, 1, 2, 1], baseFret: 1, barres: [1] },
  "A#:7": { frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, barres: [1] },
  "A#:minmaj7": { frets: [-1, 1, 3, 2, 2, 1], baseFret: 1, barres: [1] },
  "A#:dim7": { frets: [-1, 1, 2, 0, 2, -1], baseFret: 1, barres: [] },
  "A#:hdim7": { frets: [-1, 1, 2, 1, 2, -1], baseFret: 1, barres: [] },
  "A#:sus2": { frets: [-1, 1, 3, 3, 1, 1], baseFret: 1, barres: [1] },
  "A#:sus4": { frets: [-1, 1, 3, 3, 4, 1], baseFret: 1, barres: [1] },

  // B Family
  "B": { frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, barres: [2] },
  "B:min": { frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, barres: [2] },
  "B:dim": { frets: [-1, 2, 3, 4, 3, -1], baseFret: 1, barres: [] },
  "B:aug": { frets: [-1, 2, 1, 0, 0, 3], baseFret: 1, barres: [] },
  "B:maj6": { frets: [-1, 2, 4, 4, 4, 4], baseFret: 2, barres: [4] },
  "B:min6": { frets: [-1, 2, 4, 4, 3, 4], baseFret: 2, barres: [] },
  "B:maj7": { frets: [-1, 2, 4, 3, 4, 2], baseFret: 2, barres: [2] },
  "B:min7": { frets: [-1, 2, 4, 2, 3, 2], baseFret: 2, barres: [2] },
  "B:7": { frets: [-1, 2, 1, 2, 0, 2], baseFret: 1, barres: [] },
  "B:minmaj7": { frets: [-1, 2, 4, 3, 3, 2], baseFret: 2, barres: [2] },
  "B:dim7": { frets: [-1, 2, 3, 1, 3, -1], baseFret: 1, barres: [] },
  "B:hdim7": { frets: [-1, 2, 3, 2, 3, -1], baseFret: 2, barres: [] },
  "B:sus2": { frets: [-1, 2, 4, 4, 2, 2], baseFret: 2, barres: [2] },
  "B:sus4": { frets: [-1, 2, 4, 4, 5, 2], baseFret: 2, barres: [2] },
};

// All Pressing Patterns & Voicings Database (CAGED positions, barre, easy 4-string, and higher fret variations)
export const CHORD_ALTERNATIVES_DB = {
  "C": [
    { name: "C (Open Standard)", frets: [-1, 3, 2, 0, 1, 0], baseFret: 1, barres: [] },
    { name: "C (A-Shape Barre 3fr)", frets: [-1, 3, 5, 5, 5, 3], baseFret: 3, barres: [3] },
    { name: "C (G-Shape Triad 5fr)", frets: [-1, -1, 5, 5, 5, 8], baseFret: 5, barres: [5] },
    { name: "C (E-Shape Barre 8fr)", frets: [8, 10, 10, 9, 8, 8], baseFret: 8, barres: [8] },
    { name: "C (Easy 4-Str)", frets: [-1, -1, 2, 0, 1, 0], baseFret: 1, barres: [] },
  ],
  "C:min": [
    { name: "Cm (A-min Shape 3fr)", frets: [-1, 3, 5, 5, 4, 3], baseFret: 3, barres: [3] },
    { name: "Cm (Easy 4-Str 3fr)", frets: [-1, -1, 5, 5, 4, 3], baseFret: 3, barres: [] },
    { name: "Cm (E-min Shape 8fr)", frets: [8, 10, 10, 8, 8, 8], baseFret: 8, barres: [8] },
  ],
  "C:7": [
    { name: "C7 (Open)", frets: [-1, 3, 2, 3, 1, 0], baseFret: 1, barres: [] },
    { name: "C7 (A-Shape Barre 3fr)", frets: [-1, 3, 5, 3, 5, 3], baseFret: 3, barres: [3] },
    { name: "C7 (E-Shape Barre 8fr)", frets: [8, 10, 8, 9, 8, 8], baseFret: 8, barres: [8] },
  ],
  "C:maj7": [
    { name: "Cmaj7 (Open)", frets: [-1, 3, 2, 0, 0, 0], baseFret: 1, barres: [] },
    { name: "Cmaj7 (A-Shape 3fr)", frets: [-1, 3, 5, 4, 5, 3], baseFret: 3, barres: [3] },
    { name: "Cmaj7 (E-Shape 8fr)", frets: [8, 10, 9, 9, 8, 8], baseFret: 8, barres: [8] },
  ],
  "C:min7": [
    { name: "Cm7 (A-Shape 3fr)", frets: [-1, 3, 5, 3, 4, 3], baseFret: 3, barres: [3] },
    { name: "Cm7 (E-Shape 8fr)", frets: [8, 10, 8, 8, 8, 8], baseFret: 8, barres: [8] },
  ],
  "C:sus4": [
    { name: "Csus4 (Open)", frets: [-1, 3, 3, 0, 1, 1], baseFret: 1, barres: [] },
    { name: "Csus4 (Barre 3fr)", frets: [-1, 3, 5, 5, 6, 3], baseFret: 3, barres: [3] },
  ],
  "C:sus": [
    { name: "Csus4 (Open)", frets: [-1, 3, 3, 0, 1, 1], baseFret: 1, barres: [] },
    { name: "Csus4 (Barre 3fr)", frets: [-1, 3, 5, 5, 6, 3], baseFret: 3, barres: [3] },
  ],
  "C:aug": [
    { name: "Caug (Open)", frets: [-1, 3, 2, 1, 1, 0], baseFret: 1, barres: [] },
    { name: "Caug (Movable Triad)", frets: [-1, -1, 10, 9, 9, 8], baseFret: 8, barres: [] },
  ],
  "C:dim": [
    { name: "Cdim (Triad 3fr)", frets: [-1, 3, 4, 5, 4, -1], baseFret: 3, barres: [] },
  ],
  "C:dim7": [
    { name: "Cdim7 (Open/1fr)", frets: [-1, 3, 4, 2, 4, -1], baseFret: 1, barres: [] },
    { name: "Cdim7 (Movable 4fr)", frets: [-1, -1, 4, 5, 4, 5], baseFret: 4, barres: [] },
  ],
  "C:hdim7": [
    { name: "Cm7b5 (3fr)", frets: [-1, 3, 4, 3, 4, -1], baseFret: 2, barres: [] },
    { name: "Cm7b5 (8fr)", frets: [8, -1, 8, 8, 7, -1], baseFret: 7, barres: [] },
  ],
  "C:sus2": [
    { name: "Csus2 (Open)", frets: [-1, 3, 0, 0, 3, 3], baseFret: 1, barres: [] },
  ],
  "C:maj6": [
    { name: "C6 (Open)", frets: [-1, 3, 2, 2, 1, 0], baseFret: 1, barres: [] },
  ],
  "C:6": [
    { name: "C6 (Open)", frets: [-1, 3, 2, 2, 1, 0], baseFret: 1, barres: [] },
  ],
  "C:min6": [
    { name: "Cm6 (1fr)", frets: [-1, 3, 1, 2, 1, -1], baseFret: 1, barres: [] },
  ],
  "C:minmaj7": [
    { name: "Cm(maj7) (3fr)", frets: [-1, 3, 5, 4, 4, 3], baseFret: 3, barres: [3] },
  ],
  "C#": [
    { name: "C# (A-Shape Barre 4fr)", frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barres: [4] },
    { name: "C# (Easy 4-Str 4fr)", frets: [-1, -1, 6, 6, 6, 4], baseFret: 4, barres: [] },
    { name: "C# (E-Shape Barre 9fr)", frets: [9, 11, 11, 10, 9, 9], baseFret: 9, barres: [9] },
  ],
  "C#:min": [
    { name: "C#m (A-min Shape 4fr)", frets: [-1, 4, 6, 6, 5, 4], baseFret: 4, barres: [4] },
    { name: "C#m (Easy 4-Str 4fr)", frets: [-1, -1, 6, 6, 5, 4], baseFret: 4, barres: [] },
    { name: "C#m (E-min Shape 9fr)", frets: [9, 11, 11, 9, 9, 9], baseFret: 9, barres: [9] },
  ],
  "C#:7": [
    { name: "C#7 (A-Shape 4fr)", frets: [-1, 4, 6, 4, 6, 4], baseFret: 4, barres: [4] },
    { name: "C#7 (E-Shape 9fr)", frets: [9, 11, 9, 10, 9, 9], baseFret: 9, barres: [9] },
  ],
  "C#:maj7": [
    { name: "C#maj7 (A-Shape 4fr)", frets: [-1, 4, 6, 5, 6, 4], baseFret: 4, barres: [4] },
    { name: "C#maj7 (E-Shape 9fr)", frets: [9, 11, 10, 10, 9, 9], baseFret: 9, barres: [9] },
  ],
  "C#:min7": [
    { name: "C#m7 (A-Shape 4fr)", frets: [-1, 4, 6, 4, 5, 4], baseFret: 4, barres: [4] },
    { name: "C#m7 (E-Shape 9fr)", frets: [9, 11, 9, 9, 9, 9], baseFret: 9, barres: [9] },
  ],
  "C#:sus4": [
    { name: "C#sus4 (A-Shape 4fr)", frets: [-1, 4, 6, 6, 7, 4], baseFret: 4, barres: [4] },
    { name: "C#sus4 (E-Shape 9fr)", frets: [9, 11, 11, 11, 9, 9], baseFret: 9, barres: [9] },
  ],
  "C#:sus": [
    { name: "C#sus4 (A-Shape 4fr)", frets: [-1, 4, 6, 6, 7, 4], baseFret: 4, barres: [4] },
    { name: "C#sus4 (E-Shape 9fr)", frets: [9, 11, 11, 11, 9, 9], baseFret: 9, barres: [9] },
  ],
  "C#:aug": [
    { name: "C#aug (Movable Triad)", frets: [-1, -1, 11, 10, 10, 9], baseFret: 9, barres: [] },
  ],
  "C#:dim": [
    { name: "C#dim (4fr)", frets: [-1, 4, 5, 6, 5, -1], baseFret: 4, barres: [] },
  ],
  "C#:hdim7": [
    { name: "C#m7b5 (A-Shape 4fr)", frets: [-1, 4, 5, 4, 5, -1], baseFret: 4, barres: [] },
    { name: "C#m7b5 (E-Shape 9fr)", frets: [9, -1, 9, 9, 8, -1], baseFret: 8, barres: [] },
  ],
  "C#:sus2": [
    { name: "C#sus2 (4fr)", frets: [-1, 4, 6, 6, 4, 4], baseFret: 4, barres: [4] },
  ],
  "C#:maj6": [
    { name: "C#6 (4fr)", frets: [-1, 4, 6, 6, 6, 6], baseFret: 4, barres: [6] },
  ],
  "C#:6": [
    { name: "C#6 (4fr)", frets: [-1, 4, 6, 6, 6, 6], baseFret: 4, barres: [6] },
  ],
  "C#:min6": [
    { name: "C#m6 (4fr)", frets: [-1, 4, 6, 6, 5, 6], baseFret: 4, barres: [] },
  ],
  "C#:minmaj7": [
    { name: "C#m(maj7) (4fr)", frets: [-1, 4, 6, 5, 5, 4], baseFret: 4, barres: [4] },
  ],
  "D": [
    { name: "D (Open Standard)", frets: [-1, -1, 0, 2, 3, 2], baseFret: 1, barres: [] },
    { name: "D (C-Shape Barre 2fr)", frets: [-1, 5, 4, 2, 3, 2], baseFret: 2, barres: [2] },
    { name: "D (A-Shape Barre 5fr)", frets: [-1, 5, 7, 7, 7, 5], baseFret: 5, barres: [5] },
    { name: "D (E-Shape Barre 10fr)", frets: [10, 12, 12, 11, 10, 10], baseFret: 10, barres: [10] },
    { name: "D/F# (Thumb Bass)", frets: [2, 0, 0, 2, 3, 2], baseFret: 1, barres: [] },
  ],
  "D:min": [
    { name: "Dm (Open Standard)", frets: [-1, -1, 0, 2, 3, 1], baseFret: 1, barres: [] },
    { name: "Dm (A-min Shape 5fr)", frets: [-1, 5, 7, 7, 6, 5], baseFret: 5, barres: [5] },
    { name: "Dm (Easy 4-Str 5fr)", frets: [-1, -1, 7, 7, 6, 5], baseFret: 5, barres: [] },
    { name: "Dm (E-min Shape 10fr)", frets: [10, 12, 12, 10, 10, 10], baseFret: 10, barres: [10] },
  ],
  "D:7": [
    { name: "D7 (Open)", frets: [-1, -1, 0, 2, 1, 2], baseFret: 1, barres: [] },
    { name: "D7 (A-Shape 5fr)", frets: [-1, 5, 7, 5, 7, 5], baseFret: 5, barres: [5] },
    { name: "D7 (E-Shape 10fr)", frets: [10, 12, 10, 11, 10, 10], baseFret: 10, barres: [10] },
  ],
  "D:maj7": [
    { name: "Dmaj7 (Open Barre)", frets: [-1, -1, 0, 2, 2, 2], baseFret: 1, barres: [2] },
    { name: "Dmaj7 (A-Shape 5fr)", frets: [-1, 5, 7, 6, 7, 5], baseFret: 5, barres: [5] },
  ],
  "D:min7": [
    { name: "Dm7 (Open)", frets: [-1, -1, 0, 2, 1, 1], baseFret: 1, barres: [] },
    { name: "Dm7 (A-Shape 5fr)", frets: [-1, 5, 7, 5, 6, 5], baseFret: 5, barres: [5] },
  ],
  "D:sus4": [
    { name: "Dsus4 (Open)", frets: [-1, -1, 0, 2, 3, 3], baseFret: 1, barres: [] },
    { name: "Dsus4 (A-Shape 5fr)", frets: [-1, 5, 7, 7, 8, 5], baseFret: 5, barres: [5] },
  ],
  "D:sus": [
    { name: "Dsus4 (Open)", frets: [-1, -1, 0, 2, 3, 3], baseFret: 1, barres: [] },
    { name: "Dsus4 (A-Shape 5fr)", frets: [-1, 5, 7, 7, 8, 5], baseFret: 5, barres: [5] },
  ],
  "D:aug": [
    { name: "Daug (Open)", frets: [-1, -1, 0, 3, 3, 2], baseFret: 1, barres: [] },
  ],
  "D:dim": [
    { name: "Ddim (Open)", frets: [-1, -1, 0, 1, 3, 1], baseFret: 1, barres: [] },
  ],
  "D:dim7": [
    { name: "Ddim7 (Open)", frets: [-1, -1, 0, 1, 0, 1], baseFret: 1, barres: [] },
    { name: "Ddim7 (Movable 6fr)", frets: [-1, -1, 6, 7, 6, 7], baseFret: 6, barres: [] },
  ],
  "D:hdim7": [
    { name: "Dm7b5 (Open)", frets: [-1, -1, 0, 1, 1, 1], baseFret: 1, barres: [1] },
    { name: "Dm7b5 (5fr)", frets: [-1, 5, 6, 5, 6, -1], baseFret: 5, barres: [] },
  ],
  "D:sus2": [
    { name: "Dsus2 (Open)", frets: [-1, -1, 0, 2, 3, 0], baseFret: 1, barres: [] },
  ],
  "D:maj6": [
    { name: "D6 (Open)", frets: [-1, -1, 0, 2, 0, 2], baseFret: 1, barres: [] },
  ],
  "D:6": [
    { name: "D6 (Open)", frets: [-1, -1, 0, 2, 0, 2], baseFret: 1, barres: [] },
  ],
  "D:min6": [
    { name: "Dm6 (Open)", frets: [-1, -1, 0, 2, 0, 1], baseFret: 1, barres: [] },
  ],
  "D:minmaj7": [
    { name: "Dm(maj7) (Open)", frets: [-1, -1, 0, 2, 2, 1], baseFret: 1, barres: [] },
  ],
  "D#": [
    { name: "D# (A-Shape Barre 6fr)", frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barres: [6] },
    { name: "D# (Easy 4-Str 6fr)", frets: [-1, -1, 8, 8, 8, 6], baseFret: 6, barres: [] },
    { name: "D# (E-Shape Barre 11fr)", frets: [11, 13, 13, 12, 11, 11], baseFret: 11, barres: [11] },
  ],
  "D#:min": [
    { name: "D#m (A-min Shape 6fr)", frets: [-1, 6, 8, 8, 7, 6], baseFret: 6, barres: [6] },
    { name: "D#m (Easy 4-Str 6fr)", frets: [-1, -1, 8, 8, 7, 6], baseFret: 6, barres: [] },
    { name: "D#m (E-min Shape 11fr)", frets: [11, 13, 13, 11, 11, 11], baseFret: 11, barres: [11] },
  ],
  "D#:7": [
    { name: "D#7 (A-Shape 6fr)", frets: [-1, 6, 8, 6, 8, 6], baseFret: 6, barres: [6] },
    { name: "D#7 (E-Shape 11fr)", frets: [11, 13, 11, 12, 11, 11], baseFret: 11, barres: [11] },
  ],
  "D#:maj7": [
    { name: "D#maj7 (A-Shape 6fr)", frets: [-1, 6, 8, 7, 8, 6], baseFret: 6, barres: [6] },
    { name: "D#maj7 (E-Shape 11fr)", frets: [11, 13, 12, 12, 11, 11], baseFret: 11, barres: [11] },
  ],
  "D#:min7": [
    { name: "D#m7 (A-Shape 6fr)", frets: [-1, 6, 8, 6, 7, 6], baseFret: 6, barres: [6] },
    { name: "D#m7 (E-Shape 11fr)", frets: [11, 13, 11, 11, 11, 11], baseFret: 11, barres: [11] },
  ],
  "D#:sus4": [
    { name: "D#sus4 (A-Shape 6fr)", frets: [-1, 6, 8, 8, 9, 6], baseFret: 6, barres: [6] },
    { name: "D#sus4 (E-Shape 11fr)", frets: [11, 13, 13, 13, 11, 11], baseFret: 11, barres: [11] },
  ],
  "D#:sus": [
    { name: "D#sus4 (A-Shape 6fr)", frets: [-1, 6, 8, 8, 9, 6], baseFret: 6, barres: [6] },
    { name: "D#sus4 (E-Shape 11fr)", frets: [11, 13, 13, 13, 11, 11], baseFret: 11, barres: [11] },
  ],
  "D#:aug": [
    { name: "D#aug (D-Shape 1fr)", frets: [-1, -1, 1, 0, 0, 3], baseFret: 1, barres: [] },
  ],
  "D#:dim": [
    { name: "D#dim (6fr)", frets: [-1, 6, 7, 8, 7, -1], baseFret: 6, barres: [] },
  ],
  "D#:hdim7": [
    { name: "D#m7b5 (A-Shape 6fr)", frets: [-1, 6, 7, 6, 7, -1], baseFret: 6, barres: [] },
    { name: "D#m7b5 (E-Shape 11fr)", frets: [11, -1, 11, 11, 10, -1], baseFret: 10, barres: [] },
  ],
  "D#:sus2": [
    { name: "D#sus2 (6fr)", frets: [-1, 6, 8, 8, 6, 6], baseFret: 6, barres: [6] },
  ],
  "D#:maj6": [
    { name: "D#6 (6fr)", frets: [-1, 6, 8, 8, 8, 8], baseFret: 6, barres: [8] },
  ],
  "D#:6": [
    { name: "D#6 (6fr)", frets: [-1, 6, 8, 8, 8, 8], baseFret: 6, barres: [8] },
  ],
  "D#:min6": [
    { name: "D#m6 (6fr)", frets: [-1, 6, 8, 8, 7, 8], baseFret: 6, barres: [] },
  ],
  "D#:minmaj7": [
    { name: "D#m(maj7) (6fr)", frets: [-1, 6, 8, 7, 7, 6], baseFret: 6, barres: [6] },
  ],
  "E": [
    { name: "E (Open Standard)", frets: [0, 2, 2, 1, 0, 0], baseFret: 1, barres: [] },
    { name: "E (D-Shape 2fr)", frets: [-1, -1, 2, 4, 5, 4], baseFret: 2, barres: [] },
    { name: "E (C-Shape Barre 4fr)", frets: [-1, 7, 6, 4, 5, 4], baseFret: 4, barres: [4] },
    { name: "E (A-Shape Barre 7fr)", frets: [-1, 7, 9, 9, 9, 7], baseFret: 7, barres: [7] },
  ],
  "E:min": [
    { name: "Em (Open Standard)", frets: [0, 2, 2, 0, 0, 0], baseFret: 1, barres: [] },
    { name: "Em (A-min Shape 7fr)", frets: [-1, 7, 9, 9, 8, 7], baseFret: 7, barres: [7] },
    { name: "Em (Easy 4-Str 7fr)", frets: [-1, -1, 9, 9, 8, 7], baseFret: 7, barres: [] },
  ],
  "E:7": [
    { name: "E7 (Open)", frets: [0, 2, 0, 1, 0, 0], baseFret: 1, barres: [] },
    { name: "E7 (A-Shape 7fr)", frets: [-1, 7, 9, 7, 9, 7], baseFret: 7, barres: [7] },
  ],
  "E:maj7": [
    { name: "Emaj7 (Open)", frets: [0, 2, 1, 1, 0, 0], baseFret: 1, barres: [] },
    { name: "Emaj7 (A-Shape 7fr)", frets: [-1, 7, 9, 8, 9, 7], baseFret: 7, barres: [7] },
  ],
  "E:min7": [
    { name: "Em7 (Open 1-Finger)", frets: [0, 2, 0, 0, 0, 0], baseFret: 1, barres: [] },
    { name: "Em7 (Open 4-Finger)", frets: [0, 2, 2, 0, 3, 3], baseFret: 1, barres: [] },
    { name: "Em7 (A-Shape 7fr)", frets: [-1, 7, 9, 7, 8, 7], baseFret: 7, barres: [7] },
  ],
  "E:sus4": [
    { name: "Esus4 (Open)", frets: [0, 2, 2, 2, 0, 0], baseFret: 1, barres: [] },
    { name: "Esus4 (A-Shape 7fr)", frets: [-1, 7, 9, 9, 10, 7], baseFret: 7, barres: [7] },
  ],
  "E:sus": [
    { name: "Esus4 (Open)", frets: [0, 2, 2, 2, 0, 0], baseFret: 1, barres: [] },
    { name: "Esus4 (A-Shape 7fr)", frets: [-1, 7, 9, 9, 10, 7], baseFret: 7, barres: [7] },
  ],
  "E:aug": [
    { name: "Eaug (Open)", frets: [0, 3, 2, 1, 1, 0], baseFret: 1, barres: [] },
  ],
  "E:dim": [
    { name: "Edim (7fr)", frets: [-1, 7, 8, 9, 8, -1], baseFret: 7, barres: [] },
  ],
  "E:dim7": [
    { name: "Edim7 (Open)", frets: [0, 1, 2, 0, 2, 0], baseFret: 1, barres: [] },
    { name: "Edim7 (Movable 8fr)", frets: [-1, -1, 8, 9, 8, 9], baseFret: 8, barres: [] },
  ],
  "E:hdim7": [
    { name: "Em7b5 (Open)", frets: [0, 1, 0, 0, 3, 0], baseFret: 1, barres: [] },
    { name: "Em7b5 (7fr)", frets: [-1, 7, 8, 7, 8, -1], baseFret: 7, barres: [] },
  ],
  "E:sus2": [
    { name: "Esus2 (Barre 2fr)", frets: [-1, 2, 4, 4, 5, 2], baseFret: 2, barres: [2] },
  ],
  "E:maj6": [
    { name: "E6 (Open)", frets: [0, 2, 2, 1, 2, 0], baseFret: 1, barres: [] },
  ],
  "E:6": [
    { name: "E6 (Open)", frets: [0, 2, 2, 1, 2, 0], baseFret: 1, barres: [] },
  ],
  "E:min6": [
    { name: "Em6 (Open)", frets: [0, 2, 2, 0, 2, 0], baseFret: 1, barres: [] },
  ],
  "E:minmaj7": [
    { name: "Em(maj7) (Open)", frets: [0, 2, 1, 0, 0, 0], baseFret: 1, barres: [] },
  ],
  "F": [
    { name: "F (A-Shape Barre 8fr)", frets: [-1, 8, 10, 10, 10, 8], baseFret: 8, barres: [8] },
    { name: "F (Easy 4-Str 8fr)", frets: [-1, -1, 10, 10, 10, 8], baseFret: 8, barres: [] },
    { name: "F (E-Shape Barre 1fr)", frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barres: [1] },
  ],
  "F:min": [
    { name: "Fm (A-min Shape 8fr)", frets: [-1, 8, 10, 10, 9, 8], baseFret: 8, barres: [8] },
    { name: "Fm (Easy 4-Str 8fr)", frets: [-1, -1, 10, 10, 9, 8], baseFret: 8, barres: [] },
    { name: "Fm (E-min Shape 1fr)", frets: [1, 3, 3, 1, 1, 1], baseFret: 1, barres: [1] },
  ],
  "F:7": [
    { name: "F7 (A-Shape 8fr)", frets: [-1, 8, 10, 8, 10, 8], baseFret: 8, barres: [8] },
    { name: "F7 (E-Shape 1fr)", frets: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1] },
  ],
  "F:maj7": [
    { name: "Fmaj7 (Open Easy)", frets: [-1, -1, 3, 2, 1, 0], baseFret: 1, barres: [] },
    { name: "Fmaj7 (Barre 1fr)", frets: [1, 3, 2, 2, 1, 1], baseFret: 1, barres: [1] },
  ],
  "F:min7": [
    { name: "Fm7 (A-Shape 8fr)", frets: [-1, 8, 10, 8, 9, 8], baseFret: 8, barres: [8] },
    { name: "Fm7 (E-Shape 1fr)", frets: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1] },
  ],
  "F:sus4": [
    { name: "Fsus4 (A-Shape 8fr)", frets: [-1, 8, 10, 10, 11, 8], baseFret: 8, barres: [8] },
    { name: "Fsus4 (E-Shape 1fr)", frets: [1, 3, 3, 3, 1, 1], baseFret: 1, barres: [1] },
  ],
  "F:sus": [
    { name: "Fsus4 (A-Shape 8fr)", frets: [-1, 8, 10, 10, 11, 8], baseFret: 8, barres: [8] },
    { name: "Fsus4 (E-Shape 1fr)", frets: [1, 3, 3, 3, 1, 1], baseFret: 1, barres: [1] },
  ],
  "F:aug": [
    { name: "Faug (Movable Triad)", frets: [-1, -1, 3, 2, 2, 1], baseFret: 1, barres: [] },
  ],
  "F:dim": [
    { name: "Fdim (8fr)", frets: [-1, 8, 9, 10, 9, -1], baseFret: 8, barres: [] },
  ],
  "F:dim7": [
    { name: "Fdim7 (Open)", frets: [-1, -1, 0, 1, 0, 1], baseFret: 1, barres: [] },
    { name: "Fdim7 (Movable 3fr)", frets: [-1, -1, 3, 4, 3, 4], baseFret: 3, barres: [] },
  ],
  "F:hdim7": [
    { name: "Fm7b5 (A-Shape 8fr)", frets: [-1, 8, 9, 8, 9, -1], baseFret: 8, barres: [] },
    { name: "Fm7b5 (E-Shape 1fr)", frets: [1, -1, 1, 1, 0, -1], baseFret: 0, barres: [] },
  ],
  "F:sus2": [
    { name: "Fsus2 (8fr)", frets: [-1, 8, 10, 10, 8, 8], baseFret: 8, barres: [8] },
  ],
  "F:maj6": [
    { name: "F6 (Barre 1fr)", frets: [1, 3, 0, 2, 1, 1], baseFret: 1, barres: [1] },
  ],
  "F:6": [
    { name: "F6 (Barre 1fr)", frets: [1, 3, 0, 2, 1, 1], baseFret: 1, barres: [1] },
  ],
  "F:min6": [
    { name: "Fm6 (Open)", frets: [-1, -1, 0, 1, 1, 1], baseFret: 1, barres: [] },
  ],
  "F:minmaj7": [
    { name: "Fm(maj7) (1fr)", frets: [1, 3, 2, 1, 1, 1], baseFret: 1, barres: [1] },
  ],
  "F#": [
    { name: "F# (A-Shape Barre 9fr)", frets: [-1, 9, 11, 11, 11, 9], baseFret: 9, barres: [9] },
    { name: "F# (Easy 4-Str 9fr)", frets: [-1, -1, 11, 11, 11, 9], baseFret: 9, barres: [] },
    { name: "F# (E-Shape Barre 2fr)", frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barres: [2] },
  ],
  "F#:min": [
    { name: "F#m (A-min Shape 9fr)", frets: [-1, 9, 11, 11, 10, 9], baseFret: 9, barres: [9] },
    { name: "F#m (Easy 4-Str 9fr)", frets: [-1, -1, 11, 11, 10, 9], baseFret: 9, barres: [] },
    { name: "F#m (E-min Shape 2fr)", frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barres: [2] },
  ],
  "F#:7": [
    { name: "F#7 (A-Shape 9fr)", frets: [-1, 9, 11, 9, 11, 9], baseFret: 9, barres: [9] },
    { name: "F#7 (E-Shape 2fr)", frets: [2, 4, 2, 3, 2, 2], baseFret: 2, barres: [2] },
  ],
  "F#:maj7": [
    { name: "F#maj7 (A-Shape 9fr)", frets: [-1, 9, 11, 10, 11, 9], baseFret: 9, barres: [9] },
    { name: "F#maj7 (E-Shape 2fr)", frets: [2, 4, 3, 3, 2, 2], baseFret: 2, barres: [2] },
  ],
  "F#:min7": [
    { name: "F#m7 (A-Shape 9fr)", frets: [-1, 9, 11, 9, 10, 9], baseFret: 9, barres: [9] },
    { name: "F#m7 (E-Shape 2fr)", frets: [2, 4, 2, 2, 2, 2], baseFret: 2, barres: [2] },
  ],
  "F#:sus4": [
    { name: "F#sus4 (A-Shape 9fr)", frets: [-1, 9, 11, 11, 12, 9], baseFret: 9, barres: [9] },
    { name: "F#sus4 (E-Shape 2fr)", frets: [2, 4, 4, 4, 2, 2], baseFret: 2, barres: [2] },
  ],
  "F#:sus": [
    { name: "F#sus4 (A-Shape 9fr)", frets: [-1, 9, 11, 11, 12, 9], baseFret: 9, barres: [9] },
    { name: "F#sus4 (E-Shape 2fr)", frets: [2, 4, 4, 4, 2, 2], baseFret: 2, barres: [2] },
  ],
  "F#:aug": [
    { name: "F#aug (Movable Triad)", frets: [-1, -1, 4, 3, 3, 2], baseFret: 2, barres: [] },
  ],
  "F#:dim": [
    { name: "F#dim (9fr)", frets: [-1, 9, 10, 11, 10, -1], baseFret: 9, barres: [] },
  ],
  "F#:dim7": [
    { name: "F#dim7 (1fr)", frets: [2, -1, 1, 2, 1, -1], baseFret: 1, barres: [] },
    { name: "F#dim7 (Movable 4fr)", frets: [-1, -1, 4, 5, 4, 5], baseFret: 4, barres: [] },
  ],
  "F#:hdim7": [
    { name: "F#m7b5 (A-Shape 9fr)", frets: [-1, 9, 10, 9, 10, -1], baseFret: 9, barres: [] },
    { name: "F#m7b5 (E-Shape 2fr)", frets: [2, -1, 2, 2, 1, -1], baseFret: 1, barres: [] },
  ],
  "F#:sus2": [
    { name: "F#sus2 (9fr)", frets: [-1, 9, 11, 11, 9, 9], baseFret: 9, barres: [9] },
  ],
  "F#:maj6": [
    { name: "F#6 (9fr)", frets: [-1, 9, 11, 11, 11, 11], baseFret: 9, barres: [11] },
  ],
  "F#:6": [
    { name: "F#6 (9fr)", frets: [-1, 9, 11, 11, 11, 11], baseFret: 9, barres: [11] },
  ],
  "F#:min6": [
    { name: "F#m6 (9fr)", frets: [-1, 9, 11, 11, 10, 11], baseFret: 9, barres: [] },
  ],
  "F#:minmaj7": [
    { name: "F#m(maj7) (9fr)", frets: [-1, 9, 11, 10, 10, 9], baseFret: 9, barres: [9] },
  ],
  "G": [
    { name: "G (3-Finger Open)", frets: [3, 2, 0, 0, 0, 3], baseFret: 1, barres: [] },
    { name: "G (4-Finger Folk)", frets: [3, 2, 0, 0, 3, 3], baseFret: 1, barres: [] },
    { name: "G (E-Shape Barre 3fr)", frets: [3, 5, 5, 4, 3, 3], baseFret: 3, barres: [3] },
    { name: "G (C-Shape Barre 7fr)", frets: [-1, 10, 9, 7, 8, 7], baseFret: 7, barres: [7] },
    { name: "G (A-Shape Barre 10fr)", frets: [-1, 10, 12, 12, 12, 10], baseFret: 10, barres: [10] },
  ],
  "G:min": [
    { name: "Gm (A-min Shape 10fr)", frets: [-1, 10, 12, 12, 11, 10], baseFret: 10, barres: [10] },
    { name: "Gm (Easy 4-Str 10fr)", frets: [-1, -1, 12, 12, 11, 10], baseFret: 10, barres: [] },
    { name: "Gm (E-min Shape 3fr)", frets: [3, 5, 5, 3, 3, 3], baseFret: 3, barres: [3] },
  ],
  "G:7": [
    { name: "G7 (Open)", frets: [3, 2, 0, 0, 0, 1], baseFret: 1, barres: [] },
    { name: "G7 (E-Shape Barre 3fr)", frets: [3, 5, 3, 4, 3, 3], baseFret: 3, barres: [3] },
  ],
  "G:maj7": [
    { name: "Gmaj7 (Open)", frets: [3, 2, 0, 0, 0, 2], baseFret: 1, barres: [] },
    { name: "Gmaj7 (Barre 3fr)", frets: [3, 5, 4, 4, 3, 3], baseFret: 3, barres: [3] },
  ],
  "G:min7": [
    { name: "Gm7 (A-Shape 10fr)", frets: [-1, 10, 12, 10, 11, 10], baseFret: 10, barres: [10] },
    { name: "Gm7 (E-Shape 3fr)", frets: [3, 5, 3, 3, 3, 3], baseFret: 3, barres: [3] },
  ],
  "G:sus4": [
    { name: "Gsus4 (Open)", frets: [3, 3, 0, 0, 1, 3], baseFret: 1, barres: [] },
    { name: "Gsus4 (Barre 3fr)", frets: [3, 5, 5, 5, 3, 3], baseFret: 3, barres: [3] },
  ],
  "G:sus": [
    { name: "Gsus4 (Open)", frets: [3, 3, 0, 0, 1, 3], baseFret: 1, barres: [] },
    { name: "Gsus4 (Barre 3fr)", frets: [3, 5, 5, 5, 3, 3], baseFret: 3, barres: [3] },
  ],
  "G:aug": [
    { name: "Gaug (Open)", frets: [3, 2, 1, 0, 0, 3], baseFret: 1, barres: [] },
    { name: "Gaug (Movable 4-Str)", frets: [-1, -1, 5, 4, 4, 3], baseFret: 3, barres: [] },
    { name: "Gaug (D-Shape 1fr)", frets: [-1, -1, 1, 0, 0, 3], baseFret: 1, barres: [] },
  ],
  "G:dim": [
    { name: "Gdim (10fr)", frets: [-1, 10, 11, 12, 11, -1], baseFret: 10, barres: [] },
  ],
  "G:dim7": [
    { name: "Gdim7 (2fr)", frets: [3, -1, 2, 3, 2, -1], baseFret: 2, barres: [] },
    { name: "Gdim7 (Movable 5fr)", frets: [-1, -1, 5, 6, 5, 6], baseFret: 5, barres: [] },
  ],
  "G:hdim7": [
    { name: "Gm7b5 (A-Shape 10fr)", frets: [-1, 10, 11, 10, 11, -1], baseFret: 10, barres: [] },
    { name: "Gm7b5 (E-Shape 3fr)", frets: [3, -1, 3, 3, 2, -1], baseFret: 2, barres: [] },
  ],
  "G:sus2": [
    { name: "Gsus2 (Open)", frets: [3, 0, 0, 0, 3, 3], baseFret: 1, barres: [] },
  ],
  "G:maj6": [
    { name: "G6 (Open)", frets: [3, 2, 0, 0, 0, 0], baseFret: 1, barres: [] },
  ],
  "G:6": [
    { name: "G6 (Open)", frets: [3, 2, 0, 0, 0, 0], baseFret: 1, barres: [] },
  ],
  "G:min6": [
    { name: "Gm6 (Open)", frets: [3, 1, 0, 0, 3, 0], baseFret: 1, barres: [] },
  ],
  "G:minmaj7": [
    { name: "Gm(maj7) (10fr)", frets: [-1, 10, 12, 11, 11, 10], baseFret: 10, barres: [10] },
  ],
  "G#": [
    { name: "G# (A-Shape Barre 11fr)", frets: [-1, 11, 13, 13, 13, 11], baseFret: 11, barres: [11] },
    { name: "G# (Easy 4-Str 11fr)", frets: [-1, -1, 13, 13, 13, 11], baseFret: 11, barres: [] },
    { name: "G# (E-Shape Barre 4fr)", frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barres: [4] },
  ],
  "G#:min": [
    { name: "G#m (A-min Shape 11fr)", frets: [-1, 11, 13, 13, 12, 11], baseFret: 11, barres: [11] },
    { name: "G#m (Easy 4-Str 11fr)", frets: [-1, -1, 13, 13, 12, 11], baseFret: 11, barres: [] },
    { name: "G#m (E-min Shape 4fr)", frets: [4, 6, 6, 4, 4, 4], baseFret: 4, barres: [4] },
  ],
  "G#:7": [
    { name: "G#7 (A-Shape 11fr)", frets: [-1, 11, 13, 11, 13, 11], baseFret: 11, barres: [11] },
    { name: "G#7 (E-Shape 4fr)", frets: [4, 6, 4, 5, 4, 4], baseFret: 4, barres: [4] },
  ],
  "G#:maj7": [
    { name: "G#maj7 (A-Shape 11fr)", frets: [-1, 11, 13, 12, 13, 11], baseFret: 11, barres: [11] },
    { name: "G#maj7 (E-Shape 4fr)", frets: [4, 6, 5, 5, 4, 4], baseFret: 4, barres: [4] },
  ],
  "G#:min7": [
    { name: "G#m7 (A-Shape 11fr)", frets: [-1, 11, 13, 11, 12, 11], baseFret: 11, barres: [11] },
    { name: "G#m7 (E-Shape 4fr)", frets: [4, 6, 4, 4, 4, 4], baseFret: 4, barres: [4] },
  ],
  "G#:sus4": [
    { name: "G#sus4 (A-Shape 11fr)", frets: [-1, 11, 13, 13, 14, 11], baseFret: 11, barres: [11] },
    { name: "G#sus4 (E-Shape 4fr)", frets: [4, 6, 6, 6, 4, 4], baseFret: 4, barres: [4] },
  ],
  "G#:sus": [
    { name: "G#sus4 (A-Shape 11fr)", frets: [-1, 11, 13, 13, 14, 11], baseFret: 11, barres: [11] },
    { name: "G#sus4 (E-Shape 4fr)", frets: [4, 6, 6, 6, 4, 4], baseFret: 4, barres: [4] },
  ],
  "G#:aug": [
    { name: "G#aug (Movable Triad)", frets: [-1, -1, 6, 5, 5, 4], baseFret: 4, barres: [] },
  ],
  "G#:dim": [
    { name: "G#dim (11fr)", frets: [-1, 11, 12, 13, 12, -1], baseFret: 11, barres: [] },
  ],
  "G#:dim7": [
    { name: "Abdim7 (3fr)", frets: [4, -1, 3, 4, 3, -1], baseFret: 3, barres: [] },
    { name: "Abdim7 (Movable 6fr)", frets: [-1, -1, 6, 7, 6, 7], baseFret: 6, barres: [] },
  ],
  "G#:hdim7": [
    { name: "G#m7b5 (A-Shape 11fr)", frets: [-1, 11, 12, 11, 12, -1], baseFret: 11, barres: [] },
    { name: "G#m7b5 (E-Shape 4fr)", frets: [4, -1, 4, 4, 3, -1], baseFret: 3, barres: [] },
  ],
  "G#:sus2": [
    { name: "G#sus2 (11fr)", frets: [-1, 11, 13, 13, 11, 11], baseFret: 11, barres: [11] },
  ],
  "G#:maj6": [
    { name: "G#6 (11fr)", frets: [-1, 11, 13, 13, 13, 13], baseFret: 11, barres: [13] },
  ],
  "G#:6": [
    { name: "G#6 (11fr)", frets: [-1, 11, 13, 13, 13, 13], baseFret: 11, barres: [13] },
  ],
  "G#:min6": [
    { name: "G#m6 (11fr)", frets: [-1, 11, 13, 13, 12, 13], baseFret: 11, barres: [] },
  ],
  "G#:minmaj7": [
    { name: "G#m(maj7) (11fr)", frets: [-1, 11, 13, 12, 12, 11], baseFret: 11, barres: [11] },
  ],
  "A": [
    { name: "A (Open Standard)", frets: [-1, 0, 2, 2, 2, 0], baseFret: 1, barres: [] },
    { name: "A (E-Shape Barre 5fr)", frets: [5, 7, 7, 6, 5, 5], baseFret: 5, barres: [5] },
    { name: "A (D-Shape 7fr)", frets: [-1, -1, 7, 9, 10, 9], baseFret: 7, barres: [] },
    { name: "A (C-Shape Barre 9fr)", frets: [-1, 12, 11, 9, 10, 9], baseFret: 9, barres: [9] },
  ],
  "A:min": [
    { name: "Am (Open Standard)", frets: [-1, 0, 2, 2, 1, 0], baseFret: 1, barres: [] },
    { name: "Am (E-min Shape 5fr)", frets: [5, 7, 7, 5, 5, 5], baseFret: 5, barres: [5] },
    { name: "Am (Easy 4-Str 5fr)", frets: [-1, -1, 7, 5, 5, 5], baseFret: 5, barres: [5] },
    { name: "Am (D-min Shape 7fr)", frets: [-1, -1, 7, 9, 10, 8], baseFret: 7, barres: [] },
  ],
  "A:7": [
    { name: "A7 (Open)", frets: [-1, 0, 2, 0, 2, 0], baseFret: 1, barres: [] },
    { name: "A7 (E-Shape 5fr)", frets: [5, 7, 5, 6, 5, 5], baseFret: 5, barres: [5] },
  ],
  "A:maj7": [
    { name: "Amaj7 (Open)", frets: [-1, 0, 2, 1, 2, 0], baseFret: 1, barres: [] },
    { name: "Amaj7 (E-Shape 5fr)", frets: [5, 7, 6, 6, 5, 5], baseFret: 5, barres: [5] },
  ],
  "A:min7": [
    { name: "Am7 (Open)", frets: [-1, 0, 2, 0, 1, 0], baseFret: 1, barres: [] },
    { name: "Am7 (E-Shape 5fr)", frets: [5, 7, 5, 5, 5, 5], baseFret: 5, barres: [5] },
  ],
  "A:sus4": [
    { name: "Asus4 (Open)", frets: [-1, 0, 2, 2, 3, 0], baseFret: 1, barres: [] },
    { name: "Asus4 (E-Shape 5fr)", frets: [5, 7, 7, 7, 5, 5], baseFret: 5, barres: [5] },
  ],
  "A:sus": [
    { name: "Asus4 (Open)", frets: [-1, 0, 2, 2, 3, 0], baseFret: 1, barres: [] },
    { name: "Asus4 (E-Shape 5fr)", frets: [5, 7, 7, 7, 5, 5], baseFret: 5, barres: [5] },
  ],
  "A:aug": [
    { name: "Aaug (Open)", frets: [-1, 0, 3, 2, 2, 1], baseFret: 1, barres: [] },
  ],
  "A:dim": [
    { name: "Adim (Open)", frets: [-1, 0, 1, 2, 1, -1], baseFret: 1, barres: [] },
  ],
  "A:dim7": [
    { name: "Adim7 (Open)", frets: [-1, 0, 1, 2, 1, 2], baseFret: 1, barres: [] },
    { name: "Adim7 (Movable 7fr)", frets: [-1, -1, 7, 8, 7, 8], baseFret: 7, barres: [] },
  ],
  "A:hdim7": [
    { name: "Am7b5 (Open)", frets: [-1, 0, 1, 0, 1, -1], baseFret: 1, barres: [] },
    { name: "Am7b5 (5fr)", frets: [5, -1, 5, 5, 4, -1], baseFret: 4, barres: [] },
  ],
  "A:sus2": [
    { name: "Asus2 (Open)", frets: [-1, 0, 2, 2, 0, 0], baseFret: 1, barres: [] },
  ],
  "A:maj6": [
    { name: "A6 (Open)", frets: [-1, 0, 2, 2, 2, 2], baseFret: 1, barres: [2] },
  ],
  "A:6": [
    { name: "A6 (Open)", frets: [-1, 0, 2, 2, 2, 2], baseFret: 1, barres: [2] },
  ],
  "A:min6": [
    { name: "Am6 (Open)", frets: [-1, 0, 2, 2, 1, 2], baseFret: 1, barres: [] },
  ],
  "A:minmaj7": [
    { name: "Am(maj7) (Open)", frets: [-1, 0, 2, 1, 1, 0], baseFret: 1, barres: [] },
  ],
  "A#": [
    { name: "A# (A-Shape Barre 1fr)", frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
    { name: "A# (Easy 4-Str 1fr)", frets: [-1, -1, 3, 3, 3, 1], baseFret: 1, barres: [] },
    { name: "A# (E-Shape Barre 6fr)", frets: [6, 8, 8, 7, 6, 6], baseFret: 6, barres: [6] },
  ],
  "A#:min": [
    { name: "A#m (A-min Shape 1fr)", frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barres: [1] },
    { name: "A#m (Easy 4-Str 1fr)", frets: [-1, -1, 3, 3, 2, 1], baseFret: 1, barres: [] },
    { name: "A#m (E-min Shape 6fr)", frets: [6, 8, 8, 6, 6, 6], baseFret: 6, barres: [6] },
  ],
  "A#:7": [
    { name: "A#7 (A-Shape 1fr)", frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, barres: [1] },
    { name: "A#7 (E-Shape 6fr)", frets: [6, 8, 6, 7, 6, 6], baseFret: 6, barres: [6] },
  ],
  "A#:maj7": [
    { name: "A#maj7 (A-Shape 1fr)", frets: [-1, 1, 3, 2, 3, 1], baseFret: 1, barres: [1] },
    { name: "A#maj7 (E-Shape 6fr)", frets: [6, 8, 7, 7, 6, 6], baseFret: 6, barres: [6] },
  ],
  "A#:min7": [
    { name: "A#m7 (A-Shape 1fr)", frets: [-1, 1, 3, 1, 2, 1], baseFret: 1, barres: [1] },
    { name: "A#m7 (E-Shape 6fr)", frets: [6, 8, 6, 6, 6, 6], baseFret: 6, barres: [6] },
  ],
  "A#:sus4": [
    { name: "A#sus4 (A-Shape 1fr)", frets: [-1, 1, 3, 3, 4, 1], baseFret: 1, barres: [1] },
    { name: "A#sus4 (E-Shape 6fr)", frets: [6, 8, 8, 8, 6, 6], baseFret: 6, barres: [6] },
  ],
  "A#:sus": [
    { name: "A#sus4 (A-Shape 1fr)", frets: [-1, 1, 3, 3, 4, 1], baseFret: 1, barres: [1] },
    { name: "A#sus4 (E-Shape 6fr)", frets: [6, 8, 8, 8, 6, 6], baseFret: 6, barres: [6] },
  ],
  "A#:aug": [
    { name: "A#aug (Movable Triad)", frets: [-1, -1, 8, 7, 7, 6], baseFret: 6, barres: [] },
  ],
  "A#:dim": [
    { name: "A#dim (1fr)", frets: [-1, 1, 2, 3, 2, -1], baseFret: 1, barres: [] },
  ],
  "A#:dim7": [
    { name: "Bbdim7 (1fr)", frets: [-1, 1, 2, 0, 2, -1], baseFret: 1, barres: [] },
    { name: "Bbdim7 (Movable 8fr)", frets: [-1, -1, 8, 9, 8, 9], baseFret: 8, barres: [] },
  ],
  "A#:hdim7": [
    { name: "A#m7b5 (A-Shape 1fr)", frets: [-1, 1, 2, 1, 2, -1], baseFret: 1, barres: [] },
    { name: "A#m7b5 (E-Shape 6fr)", frets: [6, -1, 6, 6, 5, -1], baseFret: 5, barres: [] },
  ],
  "A#:sus2": [
    { name: "A#sus2 (1fr)", frets: [-1, 1, 3, 3, 1, 1], baseFret: 1, barres: [1] },
  ],
  "A#:maj6": [
    { name: "A#6 (1fr)", frets: [-1, 1, 3, 3, 3, 3], baseFret: 1, barres: [3] },
  ],
  "A#:6": [
    { name: "A#6 (1fr)", frets: [-1, 1, 3, 3, 3, 3], baseFret: 1, barres: [3] },
  ],
  "A#:min6": [
    { name: "A#m6 (1fr)", frets: [-1, 1, 3, 3, 2, 3], baseFret: 1, barres: [] },
  ],
  "A#:minmaj7": [
    { name: "A#m(maj7) (1fr)", frets: [-1, 1, 3, 2, 2, 1], baseFret: 1, barres: [1] },
  ],
  "B": [
    { name: "B (A-Shape Barre 2fr)", frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, barres: [2] },
    { name: "B (Easy 4-Str 2fr)", frets: [-1, -1, 4, 4, 4, 2], baseFret: 2, barres: [] },
    { name: "B (E-Shape Barre 7fr)", frets: [7, 9, 9, 8, 7, 7], baseFret: 7, barres: [7] },
  ],
  "B:min": [
    { name: "Bm (A-min Shape 2fr)", frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, barres: [2] },
    { name: "Bm (Easy 4-Str 2fr)", frets: [-1, -1, 4, 4, 3, 2], baseFret: 2, barres: [] },
    { name: "Bm (E-min Shape 7fr)", frets: [7, 9, 9, 7, 7, 7], baseFret: 7, barres: [7] },
  ],
  "B:7": [
    { name: "B7 (Open)", frets: [-1, 2, 1, 2, 0, 2], baseFret: 1, barres: [] },
    { name: "B7 (A-Shape 2fr)", frets: [-1, 2, 4, 2, 4, 2], baseFret: 2, barres: [2] },
    { name: "B7 (E-Shape 7fr)", frets: [7, 9, 7, 8, 7, 7], baseFret: 7, barres: [7] },
  ],
  "B:maj7": [
    { name: "Bmaj7 (A-Shape 2fr)", frets: [-1, 2, 4, 3, 4, 2], baseFret: 2, barres: [2] },
    { name: "Bmaj7 (E-Shape 7fr)", frets: [7, 9, 8, 8, 7, 7], baseFret: 7, barres: [7] },
  ],
  "B:min7": [
    { name: "Bm7 (Open Folk)", frets: [-1, 2, 0, 2, 0, 2], baseFret: 1, barres: [] },
    { name: "Bm7 (A-Shape 2fr)", frets: [-1, 2, 4, 2, 3, 2], baseFret: 2, barres: [2] },
    { name: "Bm7 (E-Shape 7fr)", frets: [7, 9, 7, 7, 7, 7], baseFret: 7, barres: [7] },
  ],
  "B:sus4": [
    { name: "Bsus4 (A-Shape 2fr)", frets: [-1, 2, 4, 4, 5, 2], baseFret: 2, barres: [2] },
    { name: "Bsus4 (E-Shape 7fr)", frets: [7, 9, 9, 9, 7, 7], baseFret: 7, barres: [7] },
  ],
  "B:sus": [
    { name: "Bsus4 (A-Shape 2fr)", frets: [-1, 2, 4, 4, 5, 2], baseFret: 2, barres: [2] },
    { name: "Bsus4 (E-Shape 7fr)", frets: [7, 9, 9, 9, 7, 7], baseFret: 7, barres: [7] },
  ],
  "B:aug": [
    { name: "Baug (Movable Triad)", frets: [-1, -1, 9, 8, 8, 7], baseFret: 7, barres: [] },
  ],
  "B:dim": [
    { name: "Bdim (Open)", frets: [-1, 2, 3, 4, 3, -1], baseFret: 1, barres: [] },
  ],
  "B:dim7": [
    { name: "Bdim7 (1fr)", frets: [-1, 2, 3, 1, 3, -1], baseFret: 1, barres: [] },
    { name: "Bdim7 (Movable 9fr)", frets: [-1, -1, 9, 10, 9, 10], baseFret: 9, barres: [] },
  ],
  "B:hdim7": [
    { name: "Bm7b5 (2fr)", frets: [-1, 2, 3, 2, 3, -1], baseFret: 2, barres: [] },
    { name: "Bm7b5 (7fr)", frets: [7, -1, 7, 7, 6, -1], baseFret: 6, barres: [] },
  ],
  "B:sus2": [
    { name: "Bsus2 (2fr)", frets: [-1, 2, 4, 4, 2, 2], baseFret: 2, barres: [2] },
  ],
  "B:maj6": [
    { name: "B6 (2fr)", frets: [-1, 2, 4, 4, 4, 4], baseFret: 2, barres: [4] },
  ],
  "B:6": [
    { name: "B6 (2fr)", frets: [-1, 2, 4, 4, 4, 4], baseFret: 2, barres: [4] },
  ],
  "B:min6": [
    { name: "Bm6 (2fr)", frets: [-1, 2, 4, 4, 3, 4], baseFret: 2, barres: [] },
  ],
  "B:minmaj7": [
    { name: "Bm(maj7) (2fr)", frets: [-1, 2, 4, 3, 3, 2], baseFret: 2, barres: [2] },
  ],
};
