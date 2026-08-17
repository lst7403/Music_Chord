import { ROOT_COLORS } from './constants.js';
import { normalizeRoot, getGuitarChordShape, formatChordName, transposeChordName } from './music.js';

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

export function renderGuitarChord(svgElement, titleElement, tabElement, labelElement, chordStr, capoFret = 0, soundingElement = null) {
  if (!svgElement) return;
  svgElement.innerHTML = '';

  if (!chordStr || chordStr === 'N') {
    if (titleElement) titleElement.textContent = 'No Chord (Silence)';
    if (tabElement) tabElement.textContent = 'x-x-x-x-x-x';
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
    svgElement.appendChild(text);
    return;
  }

  // Calculate actual shape to finger based on Capo
  const effectiveChord = capoFret > 0 ? transposeChordName(chordStr, -capoFret) : chordStr;
  const chordData = getGuitarChordShape(effectiveChord);

  if (titleElement) titleElement.textContent = formatChordName(effectiveChord);
  if (soundingElement) {
    soundingElement.textContent = capoFret > 0 ? `${formatChordName(chordStr)} (Capo ${capoFret})` : formatChordName(chordStr);
  }

  if (!chordData) {
    if (tabElement) tabElement.textContent = 'Custom Voicing';
    if (labelElement) labelElement.textContent = 'Frets: --';
    return;
  }

  const baseFret = chordData.baseFret || 1;

  // Tab text (e.g. x-3-2-0-1-0)
  const tabStr = chordData.frets.map(f => f === -1 ? 'x' : f.toString()).join('-');
  if (tabElement) tabElement.textContent = tabStr;
  if (labelElement) labelElement.textContent = `Base Fret: ${baseFret}`;

  // SVG Dimensions & Grid Constants
  const xOffset = 52;
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
    capoHeader.setAttribute('x', '120');
    capoHeader.setAttribute('y', '22');
    capoHeader.setAttribute('text-anchor', 'middle');
    capoHeader.setAttribute('fill', '#f59e0b');
    capoHeader.setAttribute('font-size', '11');
    capoHeader.setAttribute('font-weight', '700');
    capoHeader.setAttribute('letter-spacing', '0.8');
    capoHeader.setAttribute('font-family', "'Outfit', sans-serif");
    capoHeader.textContent = `⚡ CAPO FRET ${capoFret} (Play ${formatChordName(effectiveChord)})`;
    svgElement.appendChild(capoHeader);
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
  svgElement.appendChild(rect);

  // Nut (thick top line for open 1st fret) OR Base Fret Pill Badge on Left (for fret > 1)
  if (baseFret === 1) {
    // Open position thick Nut line (standard guitar diagram) - gold when Capo active
    const nut = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    nut.setAttribute('x1', xOffset - 1);
    nut.setAttribute('y1', yOffset);
    nut.setAttribute('x2', xOffset + width + 1);
    nut.setAttribute('y2', yOffset);
    nut.setAttribute('stroke', capoFret > 0 ? '#f59e0b' : '#f8fafc');
    nut.setAttribute('stroke-width', capoFret > 0 ? '6' : '5');
    nut.setAttribute('stroke-linecap', 'round');
    svgElement.appendChild(nut);
  } else {
    // Higher position: glowing Cyan Base Fret Pill Badge on Left
    const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    badgeBg.setAttribute('x', '10');
    badgeBg.setAttribute('y', yOffset + 5);
    badgeBg.setAttribute('width', '36');
    badgeBg.setAttribute('height', '22');
    badgeBg.setAttribute('rx', '5');
    badgeBg.setAttribute('fill', 'rgba(6, 182, 212, 0.18)');
    badgeBg.setAttribute('stroke', '#38bdf8');
    badgeBg.setAttribute('stroke-width', '1.2');
    svgElement.appendChild(badgeBg);

    const fretText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    fretText.setAttribute('x', '28');
    fretText.setAttribute('y', yOffset + 20);
    fretText.setAttribute('fill', '#38bdf8');
    fretText.setAttribute('font-size', '12');
    fretText.setAttribute('font-weight', 'bold');
    fretText.setAttribute('font-family', "'JetBrains Mono', monospace");
    fretText.setAttribute('text-anchor', 'middle');
    fretText.textContent = `${baseFret}fr`;
    svgElement.appendChild(fretText);
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
    svgElement.appendChild(line);
  }

  // Vertical Strings & Bottom Tuning Labels
  for (let s = 0; s < numStrings; s++) {
    const sx = xOffset + s * stringGap;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', sx);
    line.setAttribute('y1', yOffset);
    line.setAttribute('x2', sx);
    line.setAttribute('y2', yOffset + height);
    line.setAttribute('stroke', '#64748b');
    line.setAttribute('stroke-width', s < 3 ? '2.5' : '1.5');
    svgElement.appendChild(line);

    // Tuning Letter below string
    const tuningText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tuningText.setAttribute('x', sx);
    tuningText.setAttribute('y', yOffset + height + 18);
    tuningText.setAttribute('text-anchor', 'middle');
    tuningText.setAttribute('fill', '#64748b');
    tuningText.setAttribute('font-size', '11');
    tuningText.setAttribute('font-weight', '700');
    tuningText.setAttribute('font-family', "'JetBrains Mono', monospace");
    tuningText.textContent = STRING_NAMES[s];
    svgElement.appendChild(tuningText);
  }

  // Barre Indicator
  if (chordData.barres && chordData.barres.length > 0) {
    chordData.barres.forEach(barreFret => {
      const relativeFret = barreFret - baseFret + 1;
      if (relativeFret >= 1 && relativeFret <= numFrets) {
        // Find the string range fretted at or above the barre fret (excluding muted strings)
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
          svgElement.appendChild(barre);
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
      svgElement.appendChild(xText);
    } else if (fret === 0) {
      // Open (O)
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', yOffset - 16);
      circle.setAttribute('r', '5.5');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#10b981');
      circle.setAttribute('stroke-width', '2');
      svgElement.appendChild(circle);
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
        svgElement.appendChild(dot);
      }
    }
  });
}
