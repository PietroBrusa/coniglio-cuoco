/**
 * Ascolto dei tasti inviati dal Makey Makey.
 *
 * Tre punti dell'applicazione devono reagire allo stesso contatto — la
 * misurazione, i tocchi di avvio del livello e il ritmo della modalità
 * difficile — e ognuno ripeteva lo stesso filtro. Qui sta scritto una volta
 * sola: tasto giusto, azione predefinita del browser annullata, auto-ripetizione
 * scartata.
 *
 * @module
 */

import { useEffect, useRef } from 'react';

/**
 * Tasti che il Makey Makey invia quando il bambino chiude il circuito toccando
 * l'alimento.
 *
 * La scheda emula una tastiera e tiene il tasto premuto per tutta la durata del
 * contatto: `keydown` → `keyup` **è** il contatto. Sono gli stessi tasti di una
 * tastiera normale, che è il modo in cui il gioco si conduce durante le prove
 * senza la scheda collegata.
 */
export const MAKEY_KEYS = ['Space'];

/** Che cosa fare all'inizio e alla fine di un contatto. */
export interface MakeyKeyHandlers {
  /** Il circuito si è chiuso: inizia un contatto. */
  onPress?: () => void;
  /** Il circuito si è aperto: quel contatto è finito. */
  onRelease?: () => void;
}

/**
 * Registra gli ascoltatori del contatto sulla finestra del browser.
 *
 * Si ascolta `window` e non l'elemento a schermo perché il contatto arriva dalla
 * tastiera emulata dalla scheda: nessun elemento della pagina lo riceve. È anche
 * la ragione per cui il bersaglio disegnato nella schermata di gioco non ha
 * gestori — se contasse il tocco sullo schermo, il livello si potrebbe superare
 * senza toccare l'alimento.
 *
 * Le funzioni passate vengono tenute in un riferimento e rilette a ogni evento:
 * chi usa l'hook può quindi passarle scritte sul posto, senza che gli
 * ascoltatori vengano smontati e rimontati a ogni render.
 *
 * @param active - `true` per ascoltare. Passando a `false` gli ascoltatori
 * vengono rimossi, e nessun contatto viene più segnalato.
 * @param handlers - Che cosa fare all'inizio e alla fine del contatto.
 */
export function useMakeyKey(active: boolean, handlers: MakeyKeyHandlers): void {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!active) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!MAKEY_KEYS.includes(e.code)) return;
      e.preventDefault();
      // Un tasto tenuto premuto si ripete da solo: senza questo controllo il
      // sistema operativo aprirebbe un nuovo contatto ogni ~30 ms e un contatto
      // lungo verrebbe frantumato in decine di tocchi brevissimi.
      if (e.repeat) return;
      handlersRef.current.onPress?.();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!MAKEY_KEYS.includes(e.code)) return;
      e.preventDefault();
      handlersRef.current.onRelease?.();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [active]);
}
