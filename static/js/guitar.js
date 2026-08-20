import { ROOT_COLORS, PITCH_CLASSES } from './constants.js';
import { normalizeRoot, getGuitarChordShape, formatChordName, transposeChordName } from './music.js';

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
const OPEN_STRING_INDICES = [4, 9, 2, 7, 11, 4]; // E2, A2, D3, G3, B3, E4

export function renderGuitarChord(svgElement, titleElement, stringNotesElement, labelElement, chordInput, capoFret = 0, soundingElement = null) {
  if (!svgElement) return;

  let svg = svgElement.tagName && svgElement.tagName.toLowerCase() === 'svg'
    ? svgElement
    : (svgElement.querySelector('svg') || svgElement);

  if (svg.tagName && svg.tagName.toLowerCase() !== 'svg') {
    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    newSvg.setAttribute('viewBox', '0 0 240 280');
    newSvg.setAttribute('class', 'fretboard-svg');
    svg.innerHTML = '';
    svg.appendChild(newSvg);
    svg = newSvg;
  } else {
    svg.innerHTML = '';
  }

  if (!chordInput || chordInput === 'N') {
    if (titleElement) titleElement.textContent = 'No Chord (Silence)';
    if (stringNotesElement) {
      stringNotesElement.innerHTML = '<span class="string-note-badge muted">No Chord</span>';
    }
    if (labelElement) labelElement.textContent = 'Frets: --';
    if (soundingElement) soundingElement.textContent = '--';

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '120');
    text.setAttribute('y', '140');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#64748b');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-family', "'Outfit', sans-serif");
    text.textContent = 'No Chord';
    svg.appendChild(text);
    return;
  }

  let effectiveChord = '';
  let chordData = null;

  if (typeof chordInput === 'object' && chordInput.frets) {
    chordData = chordInput;
    effectiveChord = chordInput.name || 'Alternative';
    if (titleElement) titleElement.textContent = effectiveChord;
    if (soundingElement) soundingElement.textContent = 'Alternative Voicing';
  } else {
    const chordStr = chordInput;
    effectiveChord = capoFret > 0 ? transposeChordName(chordStr, -capoFret) : chordStr;
    chordData = getGuitarChordShape(effectiveChord);

    if (titleElement) titleElement.textContent = formatChordName(effectiveChord);
    if (soundingElement) {
      soundingElement.textContent = capoFret > 0 ? `${formatChordName(chordStr)} (Capo ${capoFret})` : formatChordName(chordStr);
    }
  }

  if (!chordData) {
    if (stringNotesElement) {
      stringNotesElement.innerHTML = '<span class="string-note-badge muted">Custom Voicing</span>';
    }
    if (labelElement) labelElement.textContent = 'Frets: --';
    return;
  }

  const baseFret = chordData.baseFret || 1;

  // Render Note of Each String (6th to 1st)
  if (stringNotesElement) {
    stringNotesElement.innerHTML = '';
    chordData.frets.forEach((fret, sIdx) => {
      const badge = document.createElement('div');
      badge.className = 'string-note-badge';
      const strName = STRING_NAMES[sIdx];

      if (fret === -1) {
        badge.classList.add('muted');
        badge.innerHTML = `<span class="str-label">${strName}</span><span class="str-note">✕</span>`;
      } else {
        const pitchIdx = (OPEN_STRING_INDICES[sIdx] + fret) % 12;
        const noteName = PITCH_CLASSES[pitchIdx];
        const noteCol = ROOT_COLORS[noteName] || '#38bdf8';
        badge.style.setProperty('--note-color', noteCol);
        badge.innerHTML = `<span class="str-label">${strName}</span><span class="str-note">${noteName}</span>`;
      }
      stringNotesElement.appendChild(badge);
    });
  }

  if (labelElement) labelElement.textContent = `Base Fret: ${baseFret}`;

  // SVG Dimensions & Grid Constants
  const xOffset = 58;
  const yOffset = 55;
  const width = 135;
  const height = 165;
  const numStrings = 6;
  const numFrets = 5;
  const stringGap = width / (numStrings - 1);
  const fretGap = height / numFrets;

  const root = effectiveChord === 'N' ? 'N' : normalizeRoot(effectiveChord.split(':')[0]);
  const dotColor = ROOT_COLORS[root] || '#6366f1';

  // Capo Fret Gold Header in SVG (when capo > 0)
  if (capoFret > 0) {
    const capoHeader = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    capoHeader.setAttribute('x', '125');
    capoHeader.setAttribute('y', '22');
    capoHeader.setAttribute('text-anchor', 'middle');
    capoHeader.setAttribute('fill', '#f59e0b');
    capoHeader.setAttribute('font-size', '11');
    capoHeader.setAttribute('font-weight', '700');
    capoHeader.setAttribute('letter-spacing', '0.8');
    capoHeader.setAttribute('font-family', "'Outfit', sans-serif");
    capoHeader.textContent = `⚡ CAPO FRET ${capoFret} (Play ${formatChordName(effectiveChord)})`;
    svg.appendChild(capoHeader);
  }

  // Fretboard Grid Background
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', xOffset);
  rect.setAttribute('y', yOffset);
  rect.setAttribute('width', width);
  rect.setAttribute('height', height);
  rect.setAttribute('fill', '#0d131f');
  rect.setAttribute('stroke', '#334155');
  rect.setAttribute('stroke-width', '1.5');
  rect.setAttribute('rx', '2');
  svg.appendChild(rect);

  // Nut (thick top line for open 1st fret) OR Base Fret Pill Badge on Left (for fret > 1)
  if (baseFret === 1) {
    const nut = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    nut.setAttribute('x1', xOffset - 1);
    nut.setAttribute('y1', yOffset);
    nut.setAttribute('x2', xOffset + width + 1);
    nut.setAttribute('y2', yOffset);
    nut.setAttribute('stroke', capoFret > 0 ? '#f59e0b' : '#f8fafc');
    nut.setAttribute('stroke-width', capoFret > 0 ? '6' : '5');
    nut.setAttribute('stroke-linecap', 'round');
    svg.appendChild(nut);
  } else {
    // Higher position: Base Fret Pill Badge shifted far left to avoid any dot overlap
    const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    badgeBg.setAttribute('x', '6');
    badgeBg.setAttribute('y', yOffset + 5);
    badgeBg.setAttribute('width', '38');
    badgeBg.setAttribute('height', '22');
    badgeBg.setAttribute('rx', '5');
    badgeBg.setAttribute('fill', 'rgba(6, 182, 212, 0.18)');
    badgeBg.setAttribute('stroke', '#38bdf8');
    badgeBg.setAttribute('stroke-width', '1.2');
    svg.appendChild(badgeBg);

    const fretText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    fretText.setAttribute('x', '25');
    fretText.setAttribute('y', yOffset + 20);
    fretText.setAttribute('fill', '#38bdf8');
    fretText.setAttribute('font-size', '12');
    fretText.setAttribute('font-weight', 'bold');
    fretText.setAttribute('font-family', "'JetBrains Mono', monospace");
    fretText.setAttribute('text-anchor', 'middle');
    fretText.textContent = `${baseFret}fr`;
    svg.appendChild(fretText);
  }

  // Horizontal Frets
  for (let f = 1; f <= numFrets; f++) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', xOffset);
    line.setAttribute('y1', yOffset + f * fretGap);
    line.setAttribute('x2', xOffset + width);
    line.setAttribute('y2', yOffset + f * fretGap);
    line.setAttribute('stroke', '#334155');
    line.setAttribute('stroke-width', '1.5');
    svg.appendChild(line);
  }

  // Vertical Strings (No bottom letters)
  for (let s = 0; s < numStrings; s++) {
    const sx = xOffset + s * stringGap;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', sx);
    line.setAttribute('y1', yOffset);
    line.setAttribute('x2', sx);
    line.setAttribute('y2', yOffset + height);
    line.setAttribute('stroke', '#64748b');
    line.setAttribute('stroke-width', s < 3 ? '2.5' : '1.5');
    svg.appendChild(line);
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
          const startX = xOffset + minString * stringGap - 6;
          const endX = xOffset + maxString * stringGap + 6;
          const barreWidth = endX - startX;

          const barre = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          barre.setAttribute('x', startX);
          barre.setAttribute('y', cy - 9);
          barre.setAttribute('width', barreWidth);
          barre.setAttribute('height', '18');
          barre.setAttribute('rx', '9');
          barre.setAttribute('fill', dotColor);
          barre.setAttribute('opacity', '0.85');
          svg.appendChild(barre);
        }
      }
    });
  }

  // Dots & Mute (X) / Open (O) Markers
  chordData.frets.forEach((fret, sIdx) => {
    const cx = xOffset + sIdx * stringGap;

    if (fret === -1) {
      // Mute (X)
      const xText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      xText.setAttribute('x', cx);
      xText.setAttribute('y', yOffset - 12);
      xText.setAttribute('text-anchor', 'middle');
      xText.setAttribute('fill', '#f43f5e');
      xText.setAttribute('font-size', '14');
      xText.setAttribute('font-weight', 'bold');
      xText.setAttribute('font-family', "'JetBrains Mono', monospace");
      xText.textContent = '✕';
      svg.appendChild(xText);
    } else if (fret === 0) {
      // Open (O)
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', yOffset - 16);
      circle.setAttribute('r', '5.5');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#10b981');
      circle.setAttribute('stroke-width', '2');
      svg.appendChild(circle);
    } else {
      // Finger Dot
      const relativeFret = fret - baseFret + 1;
      if (relativeFret >= 1 && relativeFret <= numFrets) {
        const cy = yOffset + (relativeFret - 0.5) * fretGap;
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', cx);
        dot.setAttribute('cy', cy);
        dot.setAttribute('r', '8.5');
        dot.setAttribute('fill', dotColor);
        dot.setAttribute('stroke', '#ffffff');
        dot.setAttribute('stroke-width', '1.5');
        svg.appendChild(dot);
      }
    }
  });
}
