/**
 * Suono di rinforzo di fine livello.
 *
 * @module
 */

/** Safari espone il costruttore audio con il prefisso del motore. */
type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

/**
 * Suona l'arpeggio di vittoria: do, mi, sol, do, con inviluppo esponenziale.
 *
 * Le note sono sintetizzate con la Web Audio API invece di riprodurre un file
 * audio: niente da scaricare, nessuna licenza da rispettare e nessun ritardo
 * alla prima esecuzione. Se il browser blocca l'audio o non offre l'API, il
 * gioco prosegue in silenzio.
 */
export function playVictory(): void {
  try {
    const Ctx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    const notes = [523.25, 659.25, 783.99, 1046.5];
    const step = 0.13;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const start = ctx.currentTime + i * step;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });

    window.setTimeout(() => void ctx.close(), notes.length * step * 1000 + 500);
  } catch {
    return;
  }
}
