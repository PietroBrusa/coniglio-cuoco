/**
 * Domain types shared between the UI, measurement engine, session record and
 * export utilities. They form the internal "contract" of the frontend; the
 * backend DTOs are the validated counterpart.
 */

/** A selectable food item: technical id, display label and emoji. */
export interface Food {
  id: string;
  label: string;
  emoji: string;
}

/**
 * Level mechanic:
 * - `count`: tap count (goal = number of taps);
 * - `hold`: sustained contact (goal = seconds of contact).
 */
export type LevelMode = 'count' | 'hold';

/**
 * Session difficulty selected at setup:
 * - `facile`: free tapping (every tap counts);
 * - `difficile`: "piano tiles" mechanic (only on-beat taps score).
 */
export type Difficulty = 'facile' | 'difficile';

/**
 * How a lit window is scored in hard mode:
 * - `tap`: a touch starting inside the window scores;
 * - `hold`: contact must be sustained from the window's opening to its close.
 */
export type BeatScore = 'tap' | 'hold';

/**
 * Hard-mode ("piano tiles") beat configuration of a level. Play alternates a lit
 * window lasting `onMs` and a dark pause lasting `offMs`; each beat samples both
 * durations from their range, so `[min, max]` with `min === max` is a fixed
 * cadence and `min < max` is randomised.
 */
export interface HardBeat {
  /** Duration range of the lit window, i.e. how long contact is required (ms). */
  onMs: [number, number];
  /** Duration range of the dark pause, i.e. how long to wait before pressing (ms). */
  offMs: [number, number];
  score: BeatScore;
}

/** Static definition of a game level: gameplay parameters and display texts. */
export interface Level {
  id: number;
  name: string;
  /** Clinical behaviour being stimulated (textual description). */
  behavior: string;
  mode: LevelMode;
  /** Goal: number of taps (count mode) or seconds of contact (hold mode). */
  target: number;
  /** Beat timing and scoring used when the session difficulty is `difficile`. */
  hardBeat: HardBeat;
  /** Generates the introductory narrative from the selected food label. */
  intro: (ctx: { foodLabel: string }) => string;
  hint: string;
  /** Generates the progress label (e.g. `"Collected 3 / 5"`). */
  progressLabel: (done: number, target: number) => string;
}

/** Rabbit's mood — determines the displayed emoji and CSS animation. */
export type RabbitMood = 'idle' | 'happy' | 'sniff' | 'eat' | 'cheer';

// Persisted types are re-exported from the OpenAPI-generated client:
// single source of truth aligned with the backend Swagger contract.
import type { TouchRecordDto, LevelResultMetricsDto, LevelResultDto } from './api/generated';
export type TouchRecord = TouchRecordDto;
export type LevelResultMetrics = LevelResultMetricsDto;
export type LevelResult = LevelResultDto;

/**
 * Live metrics produced by the measurement engine during a level.
 * Differs from `LevelResultMetrics` in two ways: uses `count` (vs `n`) and
 * includes `liveContactMs` (ongoing contact, never persisted). `null` means
 * the value cannot be computed yet.
 */
export interface Metrics {
  /** Total number of completed taps. */
  count: number;
  /** Time from level start to the first tap press (ms). */
  latencyMs: number | null;
  /** Sum of all completed tap durations (ms). */
  totalContactMs: number;
  /** Total contact time including an ongoing tap (ms). */
  liveContactMs: number;
  /** Mean tap duration (ms). */
  meanTouchMs: number | null;
  /** Mean Inter-Response Time: average gap between release and next press (ms). */
  meanIrtMs: number | null;
  /** Level duration (ms). */
  sessionDurationMs: number;
  /** Engagement Ratio: percentage of level time spent in contact with the food. */
  engagementRatio: number;
  touches: TouchRecordDto[];
}

/** A complete game session (child, food, difficulty, completed levels). */
export interface Session {
  childId: string;
  sessionNumber: number;
  food: string;
  foodId?: string;
  difficulty?: Difficulty;
  date: string;
  levels: LevelResult[];
}
