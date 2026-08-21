/* =========================================================
   ChordVision — Interactive Virtual Piano Voicing
   ========================================================= */

export function initPianoKeyboard(container) {
  if (!container) return;
  container.innerHTML = '';

  const octaves = [3, 4];
  const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackNotes = { 'C': 'C#', 'D': 'D#', 'F': 'F#', 'G': 'G#', 'A': 'A#' };

  octaves.forEach(oct => {
    whiteNotes.forEach(wNote => {
      const whiteKey = document.createElement('div');
      whiteKey.className = 'piano-key white';
      whiteKey.dataset.pitch = wNote;
      whiteKey.dataset.octave = oct;
      
      const label = document.createElement('span');
      label.className = 'piano-key-label';
      label.textContent = wNote + oct;
      whiteKey.appendChild(label);
      container.appendChild(whiteKey);

      if (blackNotes[wNote]) {
        const bNote = blackNotes[wNote];
        const blackKey = document.createElement('div');
        blackKey.className = 'piano-key black';
        blackKey.dataset.pitch = bNote;
        blackKey.dataset.octave = oct;
        
        const bLabel = document.createElement('span');
        bLabel.className = 'piano-key-label';
        bLabel.textContent = bNote;
        blackKey.appendChild(bLabel);
        container.appendChild(blackKey);
      }
    });
  });
}

export function highlightPianoNotes(container, notesLabel, notes) {
  if (!container) return;
  const allKeys = container.querySelectorAll('.piano-key');
  allKeys.forEach(k => k.classList.remove('active'));

  const notesArr = Array.isArray(notes) ? notes : (typeof notes === 'string' ? [notes] : []);

  if (!notesArr || notesArr.length === 0) {
    if (notesLabel) notesLabel.textContent = 'Notes: --';
    return;
  }

  if (notesLabel) {
    notesLabel.textContent = 'Notes: ' + notesArr.join(' • ');
  }

  allKeys.forEach(k => {
    if (notesArr.includes(k.dataset.pitch)) {
      k.classList.add('active');
    }
  });
}
