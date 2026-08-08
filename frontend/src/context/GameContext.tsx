/**
 * Stato della sessione di gioco in corso.
 *
 * È una macchina a stati costruita su `useReducer` e non una raccolta di stati
 * separati: le transizioni sono poche e definite, e si verificano con un test
 * unitario senza montare l'interfaccia.
 *
 * Vive in memoria e non viene persistita: ricaricando la pagina a metà sessione
 * i livelli già svolti si perdono (quelli già scritti nel database restano).
 *
 * @module
 */

import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Difficulty, Food, Level, Metrics, Session } from '@/types';
import { LEVELS, getFood } from '@/domain/levels';
import { addLevelResult, collectsData, createSession } from '@/domain/sessionRecord';
import { useAuth } from './AuthContext';

/** Stato interno della macchina. */
interface GameState {
  /** Sessione in corso, `null` prima che ne venga avviata una. */
  session: Session | null;
  /** Posizione nel percorso dei livelli, da 0. */
  levelIndex: number;
  /** Misurazioni dell'ultimo livello concluso, mostrate nella schermata del premio. */
  lastResult: Metrics | null;
  /**
   * Finestre centrate nell'ultimo livello in modalità difficile; `null` in
   * facile. Decide la terza stella e non entra in nessun record: la modalità
   * difficile non raccoglie dati.
   */
  lastBeatScore: number | null;
  /**
   * L'ultimo risultato è già stato aggiunto alla sessione.
   *
   * Impedisce che un doppio avanzamento — un doppio clic, o il rimontaggio dei
   * componenti che React esegue in sviluppo — inserisca lo stesso livello due
   * volte nel record.
   */
  resultRecorded: boolean;
  /**
   * La sessione è già stata scritta nel database.
   *
   * Impedisce il salvataggio doppio, che in una versione precedente creava due
   * documenti identici.
   */
  saved: boolean;
}

/** Le transizioni possibili della sessione di gioco. */
type GameAction =
  | {
      type: 'START';
      childId: string;
      sessionNumber: number;
      foodId: string;
      difficulty: Difficulty;
      therapist: string;
    }
  | { type: 'COMPLETE'; result: Metrics; beatsScored: number | null }
  | { type: 'NEXT' }
  | { type: 'SAVED' }
  | { type: 'NEW' };

const initialState: GameState = {
  session: null,
  levelIndex: 0,
  lastResult: null,
  lastBeatScore: null,
  resultRecorded: false,
  saved: false,
};

/**
 * Applica una transizione allo stato della sessione.
 *
 * - `START` apre una sessione nuova e azzera tutto il resto;
 * - `COMPLETE` registra le misurazioni del livello appena concluso;
 * - `NEXT` le aggiunge alla sessione e passa al livello successivo, una volta sola;
 * - `SAVED` segna la sessione come scritta nel database;
 * - `NEW` riporta tutto allo stato iniziale.
 *
 * In modalità difficile `NEXT` fa avanzare il gioco ma non aggiunge nulla alla
 * sessione (vedi {@link domain/sessionRecord.collectsData}): il percorso si
 * gioca per intero e il record resta vuoto.
 */
function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': {
      const session = {
        ...createSession({
          childId: action.childId,
          sessionNumber: action.sessionNumber,
          foodLabel: getFood(action.foodId).label,
          difficulty: action.difficulty,
          therapist: action.therapist,
        }),
        foodId: action.foodId,
      };
      return { ...initialState, session };
    }
    case 'COMPLETE':
      return {
        ...state,
        lastResult: action.result,
        lastBeatScore: action.beatsScored,
        resultRecorded: false,
      };
    case 'NEXT': {
      if (!state.session || !state.lastResult) return state;
      if (state.resultRecorded) return state;
      const level = LEVELS[state.levelIndex];
      const session = collectsData(state.session.difficulty)
        ? addLevelResult(state.session, { level, metrics: state.lastResult })
        : state.session;
      const isLast = state.levelIndex >= LEVELS.length - 1;
      return {
        ...state,
        session,
        levelIndex: isLast ? state.levelIndex : state.levelIndex + 1,
        resultRecorded: true,
      };
    }
    case 'SAVED':
      return { ...state, saved: true };
    case 'NEW':
      return initialState;
    default:
      return state;
  }
}

/** Ciò che il contesto di gioco mette a disposizione delle schermate. */
interface GameContextType {
  /** Sessione in corso, `null` prima dell'avvio. */
  session: Session | null;
  /** Posizione nel percorso dei livelli, da 0. */
  levelIndex: number;
  /** Misurazioni dell'ultimo livello concluso. */
  lastResult: Metrics | null;
  /** Finestre centrate nell'ultimo livello in difficile; `null` in facile. */
  lastBeatScore: number | null;
  /** Livello attualmente in corso. */
  level: Level;
  /** Alimento scelto per la sessione. */
  food: Food;
  /** Condizione scelta per la sessione. */
  difficulty: Difficulty;
  /** Il livello in corso è l'ultimo della gerarchia. */
  isLastLevel: boolean;
  /**
   * La sessione raccoglie dati: è `false` in modalità difficile, dove si gioca
   * soltanto e non viene registrato né salvato nulla.
   */
  collectsData: boolean;
  /** La sessione è già stata salvata nel database. */
  sessionSaved: boolean;
  /** Avvia una sessione con i dati raccolti nel setup. */
  startSession: (p: {
    sessionNumber: number;
    foodId: string;
    difficulty: Difficulty;
    therapist: string;
  }) => void;
  /** Registra le misurazioni del livello appena concluso e il suo punteggio a tempo. */
  completeLevel: (result: Metrics, beatsScored: number | null) => void;
  /** Aggiunge il risultato alla sessione e passa al livello successivo. */
  next: () => void;
  /** Segna la sessione come salvata, così non può essere scritta due volte. */
  markSessionSaved: () => void;
  /** Chiude la sessione e riporta l'applicazione allo stato iniziale. */
  newSession: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

/**
 * Rende disponibile la sessione di gioco a tutte le schermate.
 *
 * Il bambino non viene chiesto: è quello autenticato, letto dal contesto di
 * autenticazione, così il record non può finire attribuito a qualcun altro.
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const { childId } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<GameContextType>(
    () => ({
      session: state.session,
      levelIndex: state.levelIndex,
      lastResult: state.lastResult,
      lastBeatScore: state.lastBeatScore,
      level: LEVELS[state.levelIndex],
      food: getFood(state.session?.foodId),
      difficulty: state.session?.difficulty ?? 'facile',
      isLastLevel: state.levelIndex >= LEVELS.length - 1,
      collectsData: collectsData(state.session?.difficulty),
      sessionSaved: state.saved,
      startSession: ({ sessionNumber, foodId, difficulty, therapist }) =>
        dispatch({
          type: 'START',
          childId: childId ?? 'anonimo',
          sessionNumber,
          foodId,
          difficulty,
          therapist,
        }),
      completeLevel: (result, beatsScored) =>
        dispatch({ type: 'COMPLETE', result, beatsScored }),
      next: () => dispatch({ type: 'NEXT' }),
      markSessionSaved: () => dispatch({ type: 'SAVED' }),
      newSession: () => dispatch({ type: 'NEW' }),
    }),
    [state, childId],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/**
 * Accede alla sessione di gioco in corso.
 *
 * @returns Il contesto di gioco.
 * @throws Error se usato fuori da `<GameProvider>`.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve essere usato dentro <GameProvider>');
  return ctx;
}
