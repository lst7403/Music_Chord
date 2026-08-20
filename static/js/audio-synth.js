/* =========================================================
   ChordVision — Web Audio Guitar Chord Strum Synthesizer
   ========================================================= */

let audioCtx = null;

export function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Standard Guitar String Open Frequencies (E2, A2, D3, G3, B3, E4)
const OPEN_STRING_FREQS = [82.407, 110.000, 146.832, 195.998, 246.942, 329.628];

/**
 * Synthesize a plucked acoustic string sound using Web Audio API
 */
function playPluckedString(ctx, freq, startTime, duration = 1.8) {
  // Main oscillator for string body tone
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Dual oscillator: Triangle for warmth + Sawtooth for metallic guitar bite
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, startTime);

  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(freq * 1.001, startTime); // slight detune for chorus warmth

  // Dynamic low-pass filter (Karplus-like pluck brightness decaying rapidly)
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(freq * 8, 4500), startTime);
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 300), startTime + duration * 0.4);

  // Pluck amplitude envelope
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(0.28, startTime + 0.006); // Fast attack
  gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + 0.15); // Initial pluck decay
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // Long ring-out

  // Connect graph
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + duration);
  osc2.stop(startTime + duration);
}

/**
 * Play an entire guitar chord voicing with realistic natural strum arpeggiation
 * @param {Array<number>} frets - Array of 6 fret numbers [-1, 3, 2, 0, 1, 0]
 * @param {number} strumSpeed - Delay between strings in seconds (default 0.032s)
 */
export function playGuitarStrum(frets, strumSpeed = 0.032) {
  if (!frets || !Array.isArray(frets)) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime + 0.02;

    let stringIndex = 0;
    frets.forEach((fret, sIdx) => {
      if (fret !== -1) {
        // Calculate frequency: openFreq * 2^(fret / 12)
        const freq = OPEN_STRING_FREQS[sIdx] * Math.pow(2, fret / 12);
        const startTime = now + stringIndex * strumSpeed;
        playPluckedString(ctx, freq, startTime, 2.0);
        stringIndex++;
      }
    });
  } catch (err) {
    console.warn('Web Audio synthesis error:', err);
  }
}

/**
 * Synthesize a loud, crisp acoustic metronome click
 * @param {boolean} isDownbeat - True for accented downbeat (Beat 1)
 */
export function playMetronomeTick(isDownbeat = false) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Dual-tone click: Body oscillator + High transient click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // High accent: 2200Hz -> 700Hz downbeat, 1400Hz -> 450Hz regular beat
    osc.type = isDownbeat ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 2200 : 1400, now);
    osc.frequency.exponentialRampToValueAtTime(isDownbeat ? 700 : 450, now + 0.045);

    // Punchy volume envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(isDownbeat ? 0.95 : 0.70, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {
    console.warn('Metronome audio error:', e);
  }
}


