import { useEffect, useRef } from 'react';

//Tasti che il Makey Makey emula quando il cibo chiude il circuito
export const MAKEY_KEYS = ['Space'];

export interface MakeyKeyHandlers {
  onPress?: () => void;
  onRelease?: () => void;
}

export function useMakeyKey(active: boolean, handlers: MakeyKeyHandlers): void {
  //bacheca sempre aggiornata: handlersRef tiene gli handler più recenti
  const handlersRef = useRef(handlers);
  //nessun array di dipendenze -> gira dopo ogni render, aggiorna la bacheca
  useEffect(() => {
    handlersRef.current = handlers;
  });

  //questo effect gira solo quando active cambia: onKeyDown/onKeyUp vengono create una volta sola
  useEffect(() => {
    if (!active) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!MAKEY_KEYS.includes(e.code)) return;
      e.preventDefault();
      //ignora la ripetizione automatica del tasto tenuto premuto, non è un nuovo tocco
      if (e.repeat) return;
      //legge la bacheca invece di handlers direttamente: così è sempre l'handler più fresco
      handlersRef.current.onPress?.();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!MAKEY_KEYS.includes(e.code)) return;
      e.preventDefault();
      handlersRef.current.onRelease?.();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    //stacca i listener quando active torna falso o il componente si smonta
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [active]);
}
