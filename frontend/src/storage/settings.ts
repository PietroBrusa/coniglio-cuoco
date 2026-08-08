/**
 * Impostazioni dell'applicazione, memorizzate sul dispositivo.
 *
 * Le soglie del rinforzo non sono costanti nel codice perché quanto essere
 * generosi con le stelle è una decisione clinica, che cambia da bambino a
 * bambino.
 *
 * @module
 */

/** Parametri configurabili dal terapista. */
export interface AppSettings {
  /** Entro quanti millisecondi deve arrivare il primo contatto per meritare la seconda stella. */
  promptLatencyMs: number;
  /**
   * Percentuale di contatto richiesta per la terza stella nei livelli a
   * mantenimento.
   *
   * È anche la **linea di criterio** del grafico ABA e delle schede Excel:
   * l'obiettivo che il bambino vede nel gioco coincide con quello che il
   * terapista valuta nel programma.
   */
  holdEngagementPct: number;
  /** Suono di vittoria a fine livello. */
  soundEnabled: boolean;
}

/** Valori di partenza, usati anche dal pulsante «Ripristina predefiniti». */
export const DEFAULT_SETTINGS: AppSettings = {
  promptLatencyMs: 3000,
  holdEngagementPct: 40,
  soundEnabled: true,
};

const STORAGE_KEY = 'coniglio-cuoco:settings';

/**
 * Legge le impostazioni dal dispositivo.
 *
 * I valori memorizzati vengono sovrapposti ai predefiniti: aggiungendo un
 * parametro nuovo, le configurazioni già salvate continuano a funzionare invece
 * di risultare incomplete.
 *
 * @returns Le impostazioni correnti; i predefiniti se non ce ne sono di
 * memorizzate o se il contenuto è illeggibile.
 */
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Memorizza le impostazioni sul dispositivo.
 *
 * @param settings - Configurazione da salvare. Un errore di scrittura viene
 * ignorato: non poter salvare una preferenza non deve interrompere il lavoro.
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}
