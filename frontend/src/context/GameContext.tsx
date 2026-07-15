import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Difficulty, Food, Level, Metrics, Session } from '../types';
import { LEVELS, getFood } from '../game/levels';
import { addLevelResult, createSession } from '../game/sessionRecord';
import { useAuth } from './AuthContext';

/**
 * Game flow state shared across all screens. Contains only the current session
 * data (session, level index, last result); screen navigation is handled by the
 * router, not by a `stage` field in this context.
 */
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
  /** `true` once the completed session has been persisted to the backend. */
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

/**
 * Pure reducer for game state transitions.
 * - `START`: creates a fresh session and resets to level 0.
 * - `COMPLETE`: stores the metrics of the completed level.
 * - `NEXT`: appends the last result to the session and advances the level index.
 * - `SAVED`: marks the session as persisted, so it is never saved twice.
 * - `NEW`: resets to the initial idle state.
 * @param state - Current game state (never mutated).
 * @param action - Dispatched action.
 * @returns New game state.
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
        }),
        foodId: action.foodId,
      };
      return { ...initialState, session };
    }
    case 'COMPLETE':
      // A fresh result supersedes any previous one (e.g. when a level is repeated)
      // and is not yet part of the session record.
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
  /** Current session in progress, or `null` before setup. */
  session: Session | null;
  /** Zero-based index of the active level in `LEVELS`. */
  levelIndex: number;
  /** Metrics from the most recently completed level, or `null`. */
  lastResult: Metrics | null;
  /** Resolved {@link Level} object for the current `levelIndex`. */
  level: Level;
  /** Resolved {@link Food} object for the session's `foodId`. */
  food: Food;
  /** Session difficulty, defaulting to `'facile'` before setup. */
  difficulty: Difficulty;
  /** `true` when the current level is the last one in `LEVELS`. */
  isLastLevel: boolean;
  /**
   * `true` once the session has been persisted. Lives here, and not inside the
   * summary screen, so that remounting that screen (browser back / forward) does
   * not save the same session a second time.
   */
  sessionSaved: boolean;
  /**
   * Starts a new session with the parameters chosen at setup.
   * @param p.sessionNumber - Sequential session number.
   * @param p.foodId - Technical id of the selected food.
   * @param p.difficulty - Chosen difficulty.
   */
  startSession: (p: { sessionNumber: number; foodId: string; difficulty: Difficulty }) => void;
  /**
   * Stores the metrics of the just-completed level.
   * @param result - Live metrics snapshot from {@link useTouchTracker}.
   */
  completeLevel: (result: Metrics) => void;
  /** Appends the last result to the session and advances to the next level. */
  next: () => void;
  /** Marks the session as persisted, so it is not saved again on remount. */
  markSessionSaved: () => void;
  /** Resets the game state (returns to setup). */
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

/**
 * Hook to access the game flow context.
 * @returns The current {@link GameContextType} value.
 * @throws {Error} If used outside a `<GameProvider>` tree.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve essere usato dentro <GameProvider>');
  return ctx;
}
