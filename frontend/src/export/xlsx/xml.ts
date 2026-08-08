/**
 * Primitive XML condivise da tutte le parti del file .xlsx scritte a mano.
 *
 * @module
 */

/** Intestazione richiesta in testa a ogni parte XML di un pacchetto OOXML. */
export const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

/**
 * Caratteri di controllo che XML 1.0 vieta del tutto: le note del terapista sono
 * testo libero, quindi vengono rimossi invece di produrre un file illeggibile.
 */
// eslint-disable-next-line no-control-regex -- intercettarli è esattamente lo scopo
const FORBIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

/**
 * Rende una stringa sicura sia come contenuto di un elemento sia come valore di
 * un attributo fra virgolette doppie.
 *
 * @param value - Testo grezzo, tipicamente inserito dal terapista.
 * @returns Il testo con i caratteri vietati rimossi e `& < > "` sostituiti dalle
 * rispettive entità.
 */
export function esc(value: string): string {
  return value
    .replace(FORBIDDEN, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
