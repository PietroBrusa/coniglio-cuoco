import type { Level, Metrics } from '@/types';
//I valori da raggiungere vengono letti da settings.ts
import type { AppSettings } from '@/storage/settings';

export function computeStars(
  metrics: Metrics,
  level: Level,
  settings: AppSettings,
  beatsScored: number | null,
): number {
  //La prima stella è sempre data 
  let stars = 1;

  //La seconda stella è data dalla latenza
  if (metrics.latencyMs != null && metrics.latencyMs <= settings.promptLatencyMs) stars += 1;

  //La terza stella è raggiunta se l'engagement ratio supera un certo valore
  const reached =
    beatsScored === null
      ? metrics.engagementRatio >= settings.holdEngagementPct
      //in modalità difficile devo "prendere" un certo numero di finestre(beats) per averla
      : beatsScored >= level.hardBeat.beatTarget;
  if (reached) stars += 1;

  //Controllo per avere al massimo 3 stelle
  return Math.min(3, stars);
}
