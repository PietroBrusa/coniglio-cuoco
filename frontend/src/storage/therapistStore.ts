/**
 * Memoria locale dell'ultimo terapista.
 *
 * @module
 */

const STORAGE_KEY = 'coniglio-cuoco:therapist';

/**
 * Legge il nome dell'ultimo operatore che ha condotto una sessione.
 *
 * Il terapista cambia raramente da una sessione all'altra, quindi la schermata
 * di setup lo propone già compilato.
 *
 * @returns Il nome memorizzato, stringa vuota se non ce n'è uno o se
 * `localStorage` non è disponibile (navigazione privata, spazio esaurito).
 */
export function loadTherapist(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * Memorizza il nome del terapista per la sessione successiva.
 *
 * @param name - Nome inserito nella schermata di setup. Un errore di scrittura
 * viene ignorato: non poter ricordare una preferenza non deve interrompere il
 * lavoro.
 */
export function saveTherapist(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    return;
  }
}
