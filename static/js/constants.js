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
  'maj': [0, 4, 7],
  'min': [0, 3, 7],        // Minor
  'dim': [0, 3, 6],        // Diminished
  'aug': [0, 4, 8],        // Augmented
  '7': [0, 4, 7, 10],      // Dominant 7
  'maj7': [0, 4, 7, 11],   // Major 7
  'min7': [0, 3, 7, 10],   // Minor 7
  'min6': [0, 3, 7, 9],    // Minor 6
  '6': [0, 4, 7, 9],       // Major 6
  'sus4': [0, 5, 7],       // Sus4
  'sus2': [0, 2, 7],       // Sus2
  'dim7': [0, 3, 6, 9],    // Diminished 7
  'hdim7': [0, 3, 6, 10],  // Half-diminished
};

// Guitar chord voicings (E A D G B e: -1 for mute, 0 for open, >0 for fret)
export const GUITAR_CHORDS_DB = {
  // C Family
  'C': { frets: [-1, 3, 2, 0, 1, 0], baseFret: 1, barres: [] },
  'C:min': { frets: [-1, 3, 5, 5, 4, 3], baseFret: 3, barres: [3] },
  'C:7': { frets: [-1, 3, 2, 3, 1, 0], baseFret: 1, barres: [] },
  'C:maj7': { frets: [-1, 3, 2, 0, 0, 0], baseFret: 1, barres: [] },
  'C:min7': { frets: [-1, 3, 5, 3, 4, 3], baseFret: 3, barres: [3] },
  'C:sus4': { frets: [-1, 3, 3, 0, 1, 1], baseFret: 1, barres: [] },
  'C:aug': { frets: [-1, 3, 2, 1, 1, 0], baseFret: 1, barres: [] },
  'C:dim': { frets: [-1, 3, 4, 2, 4, -1], baseFret: 1, barres: [] },

  // C# / Db Family
  'C#': { frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barres: [4] },
  'C#:min': { frets: [-1, 4, 6, 6, 5, 4], baseFret: 4, barres: [4] },
  'C#:7': { frets: [-1, 4, 6, 4, 6, 4], baseFret: 4, barres: [4] },
  'C#:maj7': { frets: [-1, 4, 6, 5, 6, 4], baseFret: 4, barres: [4] },
  'C#:min7': { frets: [-1, 4, 6, 4, 5, 4], baseFret: 4, barres: [4] },

  // D Family
  'D': { frets: [-1, -1, 0, 2, 3, 2], baseFret: 1, barres: [] },
  'D:min': { frets: [-1, -1, 0, 2, 3, 1], baseFret: 1, barres: [] },
  'D:7': { frets: [-1, -1, 0, 2, 1, 2], baseFret: 1, barres: [] },
  'D:maj7': { frets: [-1, -1, 0, 2, 2, 2], baseFret: 1, barres: [2] },
  'D:min7': { frets: [-1, -1, 0, 2, 1, 1], baseFret: 1, barres: [] },
  'D:sus4': { frets: [-1, -1, 0, 2, 3, 3], baseFret: 1, barres: [] },
  'D:aug': { frets: [-1, -1, 0, 3, 3, 2], baseFret: 1, barres: [] },

  // D# / Eb Family
  'D#': { frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barres: [6] },
  'D#:min': { frets: [-1, 6, 8, 8, 7, 6], baseFret: 6, barres: [6] },
  'D#:7': { frets: [-1, 6, 8, 6, 8, 6], baseFret: 6, barres: [6] },
  'D#:min7': { frets: [-1, 6, 8, 6, 7, 6], baseFret: 6, barres: [6] },

  // E Family
  'E': { frets: [0, 2, 2, 1, 0, 0], baseFret: 1, barres: [] },
  'E:min': { frets: [0, 2, 2, 0, 0, 0], baseFret: 1, barres: [] },
  'E:7': { frets: [0, 2, 0, 1, 0, 0], baseFret: 1, barres: [] },
  'E:maj7': { frets: [0, 2, 1, 1, 0, 0], baseFret: 1, barres: [] },
  'E:min7': { frets: [0, 2, 2, 0, 3, 0], baseFret: 1, barres: [] },
  'E:sus4': { frets: [0, 2, 2, 2, 0, 0], baseFret: 1, barres: [] },

  // F Family
  'F': { frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barres: [1] },
  'F:min': { frets: [1, 3, 3, 1, 1, 1], baseFret: 1, barres: [1] },
  'F:7': { frets: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1] },
  'F:maj7': { frets: [-1, -1, 3, 2, 1, 0], baseFret: 1, barres: [] },
  'F:min7': { frets: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1] },
  'F:min6': { frets: [-1, -1, 0, 1, 1, 1], baseFret: 1, barres: [] },

  // F# / Gb Family
  'F#': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barres: [2] },
  'F#:min': { frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barres: [2] },
  'F#:7': { frets: [2, 4, 2, 3, 2, 2], baseFret: 2, barres: [2] },
  'F#:min7': { frets: [2, 4, 2, 2, 2, 2], baseFret: 2, barres: [2] },

  // G Family
  'G': { frets: [3, 2, 0, 0, 0, 3], baseFret: 1, barres: [] },
  'G:min': { frets: [3, 5, 5, 3, 3, 3], baseFret: 3, barres: [3] },
  'G:7': { frets: [3, 2, 0, 0, 0, 1], baseFret: 1, barres: [] },
  'G:maj7': { frets: [3, 2, 0, 0, 0, 2], baseFret: 1, barres: [] },
  'G:min7': { frets: [3, 5, 3, 3, 3, 3], baseFret: 3, barres: [3] },
  'G:sus4': { frets: [3, 3, 0, 0, 1, 3], baseFret: 1, barres: [] },

  // G# / Ab Family
  'G#': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barres: [4] },
  'G#:min': { frets: [4, 6, 6, 4, 4, 4], baseFret: 4, barres: [4] },
  'G#:7': { frets: [4, 6, 4, 5, 4, 4], baseFret: 4, barres: [4] },
  'G#:aug': { frets: [-1, -1, 2, 1, 1, 0], baseFret: 1, barres: [] },
  'G#:maj7': { frets: [4, 6, 5, 5, 4, 4], baseFret: 4, barres: [4] },

  // A Family
  'A': { frets: [-1, 0, 2, 2, 2, 0], baseFret: 1, barres: [] },
  'A:min': { frets: [-1, 0, 2, 2, 1, 0], baseFret: 1, barres: [] },
  'A:7': { frets: [-1, 0, 2, 0, 2, 0], baseFret: 1, barres: [] },
  'A:maj7': { frets: [-1, 0, 2, 1, 2, 0], baseFret: 1, barres: [] },
  'A:min7': { frets: [-1, 0, 2, 0, 1, 0], baseFret: 1, barres: [] },
  'A:sus4': { frets: [-1, 0, 2, 2, 3, 0], baseFret: 1, barres: [] },
  'A:dim': { frets: [-1, 0, 1, 2, 1, -1], baseFret: 1, barres: [] },

  // A# / Bb Family
  'A#': { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  'A#:min': { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barres: [1] },
  'A#:7': { frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, barres: [1] },
  'A#:maj7': { frets: [-1, 1, 3, 2, 3, 1], baseFret: 1, barres: [1] },
  'A#:min7': { frets: [-1, 1, 3, 1, 2, 1], baseFret: 1, barres: [1] },

  // B Family
  'B': { frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, barres: [2] },
  'B:min': { frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, barres: [2] },
  'B:7': { frets: [-1, 2, 1, 2, 0, 2], baseFret: 1, barres: [] },
  'B:maj7': { frets: [-1, 2, 4, 3, 4, 2], baseFret: 2, barres: [2] },
  'B:min7': { frets: [-1, 2, 4, 2, 3, 2], baseFret: 2, barres: [2] },
  'B:dim': { frets: [-1, 2, 3, 4, 3, -1], baseFret: 1, barres: [] },
};

// Alternative & Easier Guitar Chord Voicings Database
export const CHORD_ALTERNATIVES_DB = {
  // C Family Alternatives
  'C': [
    { name: 'C', frets: [-1, 1, 3, 3, 3, 1], baseFret: 3, barres: [3] },
  ],
  'C:min': [
    { name: 'Fm (Easy 4-Str)', frets: [-1, -1, 3, 1, 1, 1], baseFret: 1, barres: [1] },
    { name: 'Fm7 (Full)', frets: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1] }
  ],




  // F Family Alternatives
  'F': [
    { name: 'F (Easy 4-Str)', frets: [-1, -1, 3, 2, 1, 1], baseFret: 1, barres: [1] },
    { name: 'Fmaj7', frets: [-1, -1, 3, 2, 1, 0], baseFret: 1, barres: [] },
    { name: 'F (C-Shape 5fr)', frets: [-1, 8, 7, 5, 6, 5], baseFret: 5, barres: [5] }
  ],
  'F:min': [
    { name: 'Fm (Easy 4-Str)', frets: [-1, -1, 3, 1, 1, 1], baseFret: 1, barres: [1] },
    { name: 'Fm7 (Full)', frets: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [1] }
  ],

  // B Minor Family Alternatives
  'B:min': [
    { name: 'Bm (Easy 4-Str)', frets: [-1, -1, 4, 4, 3, 2], baseFret: 1, barres: [] },
    { name: 'Bm7 (Open)', frets: [-1, 2, 0, 2, 0, 2], baseFret: 1, barres: [] },
    { name: 'Bm (7th Fret)', frets: [7, 9, 9, 7, 7, 7], baseFret: 7, barres: [7] }
  ],

  // Bb / A# Family Alternatives
  'A#': [
    { name: 'Bb (Easy 4-Str)', frets: [-1, -1, 3, 3, 3, 1], baseFret: 1, barres: [] },
    { name: 'Bbmaj7', frets: [-1, 1, 3, 2, 3, 1], baseFret: 1, barres: [1] },
    { name: 'Bb (6th Fret)', frets: [6, 8, 8, 7, 6, 6], baseFret: 6, barres: [6] }
  ],
  'A#:min': [
    { name: 'Bbm (Easy 4-Str)', frets: [-1, -1, 3, 3, 2, 1], baseFret: 1, barres: [] }
  ],

  // G Family Alternatives
  'G': [
    { name: 'G (4-Finger Folk)', frets: [3, 2, 0, 0, 3, 3], baseFret: 1, barres: [] },
    { name: 'Gmaj7', frets: [3, 2, 0, 0, 0, 2], baseFret: 1, barres: [] },
    { name: 'G (3rd Fret Barre)', frets: [3, 5, 5, 4, 3, 3], baseFret: 3, barres: [3] }
  ],

  // D Family Alternatives
  'D': [
    { name: 'Dsus2', frets: [-1, -1, 0, 2, 3, 0], baseFret: 1, barres: [] },
    { name: 'Dsus4', frets: [-1, -1, 0, 2, 3, 3], baseFret: 1, barres: [] },
    { name: 'D/F# (Thumb)', frets: [2, 0, 0, 2, 3, 2], baseFret: 1, barres: [] }
  ],
  'D:min': [
    { name: 'Dm7', frets: [-1, -1, 0, 2, 1, 1], baseFret: 1, barres: [] },
    { name: 'Dm (5th Fret)', frets: [-1, 5, 7, 7, 6, 5], baseFret: 5, barres: [5] }
  ],

  // A Minor Family Alternatives
  'A:min': [
    { name: 'Am7 (Open)', frets: [-1, 0, 2, 0, 1, 0], baseFret: 1, barres: [] },
    { name: 'Am9', frets: [-1, 0, 2, 4, 1, 0], baseFret: 1, barres: [] },
    { name: 'Am (5th Fret)', frets: [5, 7, 7, 5, 5, 5], baseFret: 5, barres: [5] }
  ],

  // E Minor Family Alternatives
  'E:min': [
    { name: 'Em7 (1-Finger)', frets: [0, 2, 0, 0, 0, 0], baseFret: 1, barres: [] },
    { name: 'Em7 (4-Finger)', frets: [0, 2, 2, 0, 3, 3], baseFret: 1, barres: [] },
    { name: 'Em (7th Fret)', frets: [-1, 7, 9, 9, 8, 7], baseFret: 7, barres: [7] }
  ],

  // Eb / D# Family Alternatives
  'D#': [
    { name: 'Eb (Easy 4-Str)', frets: [-1, -1, 5, 3, 4, 3], baseFret: 3, barres: [] },
    { name: 'Ebmaj7', frets: [-1, 6, 8, 7, 8, 6], baseFret: 6, barres: [6] }
  ],

  // Ab / G# Family Alternatives
  'G#': [
    { name: 'Ab (Easy 4-Str)', frets: [-1, -1, 6, 5, 4, 4], baseFret: 4, barres: [4] }
  ],

  // Db / C# Family Alternatives
  'C#': [
    { name: 'C# (Easy 4-Str)', frets: [-1, -1, 6, 6, 6, 4], baseFret: 4, barres: [4] }
  ],

  // F# / Gb Family Alternatives
  'F#': [
    { name: 'F# (Easy 4-Str)', frets: [-1, -1, 4, 3, 2, 2], baseFret: 2, barres: [2] }
  ],

  // B Major Family Alternatives
  'B': [
    { name: 'B7 (Open Blues)', frets: [-1, 2, 1, 2, 0, 2], baseFret: 1, barres: [] },
    { name: 'B (Easy 4-Str)', frets: [-1, -1, 4, 4, 4, 2], baseFret: 2, barres: [2] }
  ]
};
