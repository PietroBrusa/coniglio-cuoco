import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Difficulty, Food, Level, Metrics, Session } from '../types';
import { LEVELS, getFood } from '../game/levels';
import { addLevelResult, createSession } from '../game/sessionRecord';
import { useAuth } from './AuthContext';

interface GameState {
  session: Session | null;
  levelIndex: number;
  lastResult: Metrics | null;
  /**
   * `true` once `lastResult` has been appended to the session by `NEXT`.
   * Makes `NEXT` idempotent: without it, going back to /reward with the browser
   * and pressing "avanti" again would append the same result a second time.
   */
  resultRecorded: boolean;
  saved: boolean;
}

type GameAction =
  | { type: 'START'; childId: string; sessionNumber: number; foodId: string; difficulty: Difficulty }
  | { type: 'COMPLETE'; result: Metrics }
  | { type: 'NEXT' }
  | { type: 'SAVED' }
  | { type: 'NEW' };

const initialState: GameState = {
  session: null,
  levelIndex: 0,
  lastResult: null,
  resultRecorded: false,
  saved: false,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': {
      const session = {
        ...createSession({
          childId: action.childId,
          sessionNumber: action.sessionNumber,
          foodLabel: getFood(action.foodId).label,
          difficulty: action.difficulty,
        }),
        foodId: action.foodId,
      };
      return { ...initialState, session };
    }
    case 'COMPLETE':
      return { ...state, lastResult: action.result, resultRecorded: false };
    case 'NEXT': {
      if (!state.session || !state.lastResult) return state;
      // Already appended: the user came back to /reward and pressed "avanti" twice.
      if (state.resultRecorded) return state;
      const level = LEVELS[state.levelIndex];
      const session = addLevelResult(state.session, { level, metrics: state.lastResult });
      const isLast = state.levelIndex >= LEVELS.length - 1;
      // `lastResult` is kept (not cleared): while navigating to the next level
      // it prevents the /reward guard from seeing a null result and redirecting
      // back to setup. It will be overwritten by the next level's completion.
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

interface GameContextType {
  session: Session | null;
  levelIndex: number;
  lastResult: Metrics | null;
  level: Level;
  food: Food;
  difficulty: Difficulty;
  isLastLevel: boolean;
  /**
   * `true` once the session has been persisted. Lives here, and not inside the
   * summary screen, so that remounting that screen (browser back / forward) does
   * not save the same session a second time.
   */
  sessionSaved: boolean;
  startSession: (p: { sessionNumber: number; foodId: string; difficulty: Difficulty }) => void;
  completeLevel: (result: Metrics) => void;
  next: () => void;
  markSessionSaved: () => void;
  newSession: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { childId } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<GameContextType>(
    () => ({
      session: state.session,
      levelIndex: state.levelIndex,
      lastResult: state.lastResult,
      level: LEVELS[state.levelIndex],
      food: getFood(state.session?.foodId),
      difficulty: state.session?.difficulty ?? 'facile',
      isLastLevel: state.levelIndex >= LEVELS.length - 1,
      sessionSaved: state.saved,
      startSession: ({ sessionNumber, foodId, difficulty }) =>
        dispatch({ type: 'START', childId: childId ?? 'anonimo', sessionNumber, foodId, difficulty }),
      completeLevel: (result) => dispatch({ type: 'COMPLETE', result }),
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
