import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Difficulty, Food, Level, Metrics, Session } from '@/types';
import { LEVELS, getFood } from '@/domain/levels';
import { addLevelResult, collectsData, createSession } from '@/domain/sessionRecord';
import { useAuth } from './AuthContext';

//Stato attuale
interface GameState {
  //record della sessione
  session: Session | null;
  //indice del livello
  levelIndex: number;
  //esiti ultimo livello giocato
  lastResult: Metrics | null;
  lastBeatScore: number | null;
  resultRecorded: boolean;
  //è già sul db
  saved: boolean;
}

//Azione di gioco
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

//stato iniziale
const initialState: GameState = {
  session: null,
  levelIndex: 0,
  lastResult: null,
  lastBeatScore: null,
  resultRecorded: false,
  saved: false,
};

//Info: separazione NEXT e COMPLETE avviene in quanto se ripeto il livello non passo a NEXT e non registro i dati
function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': {
      const session = createSession({
        childId: action.childId,
        sessionNumber: action.sessionNumber,
        foodId: action.foodId,
        difficulty: action.difficulty,
        therapist: action.therapist,
      });
      return { ...initialState, session };
    }
    //Scatta a fine livello, mette il risultato in lastResult
    case 'COMPLETE':
      return {
        ...state,
        lastResult: action.result,
        lastBeatScore: action.beatsScored,
        resultRecorded: false,
      };
      //passaggio al prossimo livello
    case 'NEXT': {
      //controllo sessione o risultato presenti
      if (!state.session || !state.lastResult) return state;
      //risultati già presenti -> non li scrive
      if (state.resultRecorded) return state;
      const level = LEVELS[state.levelIndex];
      //controllo se il gioco è in difficile, se si non prende i dati
      const session = collectsData(state.session.difficulty)
        ? addLevelResult(state.session, { level, metrics: state.lastResult })
        : state.session;
      //passa al prossimo livello 
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
    //torna a una sessione vuota (null)
    case 'NEW':
      return initialState;
    default:
      return state;
  }
}

interface GameContextType {
  session: Session | null;
  levelIndex: number;
  lastResult: Metrics | null;
  lastBeatScore: number | null;
  level: Level;
  food: Food;
  difficulty: Difficulty;
  isLastLevel: boolean;
  collectsData: boolean;
  sessionSaved: boolean;
  startSession: (p: {
    sessionNumber: number;
    foodId: string;
    difficulty: Difficulty;
    therapist: string;
  }) => void;
  completeLevel: (result: Metrics, beatsScored: number | null) => void;
  next: () => void;
  markSessionSaved: () => void;
  newSession: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { childId } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  //ricalcola il valore solo al cambio di stato o di childid
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
      //i dati vengono presi dall'AuthContext
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

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve essere usato dentro <GameProvider>');
  return ctx;
}
