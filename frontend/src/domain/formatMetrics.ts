/**
 * Formattazione delle metriche per la lettura umana.
 *
 * Isolata perché tre schermate diverse (premio, riepilogo, dashboard) mostrano
 * le stesse misure: così una metrica appare sempre con la stessa etichetta e la
 * stessa unità, e cambiarla in un punto la cambia ovunque.
 *
 * @module
 */

/** Una riga della griglia delle misurazioni: etichetta e valore già formattato. */
export interface MetricRow {
  /** Nome della metrica in italiano, es. `Latenza 1° tocco`. */
  label: string;
  /** Valore pronto da mostrare, con unità di misura, oppure `—` se non definito. */
  value: string | number;
}

/**
 * Converte le metriche di un livello nelle righe mostrate a schermo: i
 * millisecondi diventano secondi con due decimali e i valori indefiniti un
 * trattino.
 *
 * @param m - Metriche del livello. Accetta sia la forma in memoria (`count`) sia
 * quella salvata nel database (`n`), che differiscono solo per il nome di quel
 * campo.
 * @returns Le sette righe della griglia, nell'ordine in cui vanno mostrate.
 */
export function formatMetrics(m: {
  count?: number;
  n?: number;
  latencyMs: number | null;
  totalContactMs: number;
  meanTouchMs: number | null;
  meanIrtMs: number | null;
  sessionDurationMs: number;
  engagementRatio: number;
}): MetricRow[] {
  return [
    { label: 'Tocchi (n)', value: m.count ?? m.n ?? 0 },
    { label: 'Latenza 1° tocco', value: m.latencyMs == null ? '—' : `${s2(m.latencyMs)} s` },
    { label: 'Contatto totale', value: `${s2(m.totalContactMs)} s` },
    { label: 'Durata media tocco', value: m.meanTouchMs == null ? '—' : `${s2(m.meanTouchMs)} s` },
    { label: 'IRT medio', value: m.meanIrtMs == null ? '—' : `${s2(m.meanIrtMs)} s` },
    { label: 'Durata sessione', value: `${s2(m.sessionDurationMs)} s` },
    { label: 'Engagement Ratio', value: `${m.engagementRatio.toFixed(1)} %` },
  ];
}

/** Millisecondi in secondi, con due decimali. */
const s2 = (v: number): string => (v / 1000).toFixed(2);
