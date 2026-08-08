/**
 * Assegnazione delle stelle di fine livello.
 *
 * Le soglie non sono costanti nel codice ma parametri configurabili dal
 * terapista: la generosità del rinforzo è una decisione clinica, che cambia da
 * bambino a bambino.
 *
 * @module
 */

import type { Level, Metrics } from '@/types';
import type { AppSettings } from '@/storage/settings';

/**
 * Calcola quante stelle merita il livello appena concluso, da 1 a 3.
 *
 * Il criterio è cumulativo:
 *
 * 1. **sempre**, per aver completato il livello — il rinforzo segue la
 *    partecipazione, non solo la prestazione eccellente;
 * 2. **approccio pronto**: primo contatto entro `promptLatencyMs`;
 * 3. **obiettivo del livello raggiunto**, misurato secondo la meccanica giocata.
 *
 * La terza stella è l'unica che distingue le due modalità, e le distingue perché
 * misurano cose diverse. In facile conta la percentuale di tempo a contatto. In
 * difficile conta il numero di finestre centrate: lì il contatto è possibile
 * solo a finestra accesa, quindi un contatto lungo non è una prestazione ma il
 * modo di evitare il compito — premiarlo significherebbe dare tre stelle a chi
 * tiene il dito appoggiato senza mai rispondere a tempo.
 *
 * @param metrics - Misurazioni del livello concluso.
 * @param level - Livello eseguito, da cui si legge l'obiettivo di ritmo.
 * @param settings - Soglie configurate nelle impostazioni dell'app.
 * @param beatsScored - Finestre centrate in modalità difficile; `null` in
 * modalità facile, dove il ritmo non viene proposto.
 * @returns Un intero fra 1 e 3.
 */
export function computeStars(
  metrics: Metrics,
  level: Level,
  settings: AppSettings,
  beatsScored: number | null,
): number {
  let stars = 1;

  if (metrics.latencyMs != null && metrics.latencyMs <= settings.promptLatencyMs) stars += 1;

  const reached =
    beatsScored === null
      ? metrics.engagementRatio >= settings.holdEngagementPct
      : beatsScored >= level.hardBeat.beatTarget;
  if (reached) stars += 1;

  return Math.min(3, stars);
}
