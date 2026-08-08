/**
 * Regole del ritmo della modalità difficile.
 *
 * Funzioni pure, isolate dal componente di gioco perché sono la parte che decide
 * se un tentativo vale un punto: qui si possono verificare con test deterministici.
 *
 * @module
 */

/**
 * Anticipo tollerato: un contatto iniziato fino a 150 ms **prima**
 * dell'accensione conta comunque come tenuto per tutta la finestra.
 *
 * Volutamente stretto: se fosse ampio basterebbe tenere il dito sempre premuto.
 */
export const HOLD_EARLY_MS = 150;

/**
 * Ritardo tollerato: un contatto iniziato fino a 400 ms **dopo** l'accensione
 * conta comunque come valido.
 *
 * Più largo dell'anticipo perché un bambino reagisce *dopo* lo stimolo:
 * pretendere una risposta entro 150 ms sarebbe irrealistico.
 */
export const HOLD_GRACE_MS = 400;

/**
 * Estrae una durata casuale nell'intervallo indicato.
 *
 * Con `min === max` il ritmo è fisso e prevedibile (livello 1); con estremi
 * diversi cambia a ogni battuta, così il bambino non può anticipare a memoria e
 * deve guardare l'alimento.
 *
 * @param range - Estremi `[min, max]` in millisecondi.
 * @param rand - Generatore casuale in `[0, 1)`; iniettabile per rendere
 * deterministici i test.
 * @returns Una durata in millisecondi, distribuita uniformemente nell'intervallo.
 */
export function sampleBeatMs([min, max]: [number, number], rand: () => number = Math.random): number {
  return min + rand() * (max - min);
}

/**
 * Stabilisce se il contatto ha attraversato la finestra utile, cioè se era già
 * in corso quando la finestra si è chiusa ed è iniziato entro le tolleranze.
 *
 * Va valutata alla **chiusura** della finestra: prima non si può sapere se il
 * bambino ha mantenuto il contatto.
 *
 * @param openedAt - Istante di accensione della finestra.
 * @param pressStart - Istante di inizio del contatto in corso, `null` se il
 * bambino non sta toccando.
 * @returns `true` se il tentativo vale un punto.
 */
export function isHeldThrough(openedAt: number, pressStart: number | null): boolean {
  if (pressStart === null) return false;
  return pressStart >= openedAt - HOLD_EARLY_MS && pressStart <= openedAt + HOLD_GRACE_MS;
}
