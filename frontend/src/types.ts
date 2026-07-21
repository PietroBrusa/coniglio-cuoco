export interface Food {
  id: string;
  label: string;
  emoji: string;
}

/** `count`: goal is a number of taps. `hold`: goal is seconds of contact. */
export type LevelMode = 'count' | 'hold';

/** `facile`: every tap counts. `difficile`: only on-beat taps score. */
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
  onMs: [number, number];
  offMs: [number, number];
  score: BeatScore;
}

export interface Level {
  id: number;
  name: string;
  /** Clinical behaviour being stimulated (textual description). */
  behavior: string;
  mode: LevelMode;
  /** Goal: number of taps (count mode) or seconds of contact (hold mode). */
  target: number;
  hardBeat: HardBeat;
  intro: (ctx: { foodLabel: string }) => string;
  hint: string;
  progressLabel: (done: number, target: number) => string;
}

export type RabbitMood = 'idle' | 'happy' | 'sniff' | 'eat' | 'cheer';

// Persisted types are re-exported from the OpenAPI-generated client:
// single source of truth aligned with the backend Swagger contract.
import type { TouchRecordDto, LevelResultMetricsDto, LevelResultDto } from './api/generated';
export type TouchRecord = TouchRecordDto;
export type LevelResultMetrics = LevelResultMetricsDto;
export type LevelResult = LevelResultDto;

/**
 * Live metrics produced by the measurement engine during a level. Differs from
 * `LevelResultMetrics` in two ways: uses `count` (vs `n`) and includes
 * `liveContactMs` (ongoing contact, never persisted).
 */
export interface Metrics {
  count: number;
  /** Time from level start to the first tap press (ms). */
  latencyMs: number | null;
  /** Sum of all completed tap durations (ms). */
  totalContactMs: number;
  /** Total contact time including an ongoing tap (ms). */
  liveContactMs: number;
  meanTouchMs: number | null;
  /** Mean Inter-Response Time: average gap between release and next press (ms). */
  meanIrtMs: number | null;
  sessionDurationMs: number;
  /** Percentage of level time spent in contact with the food. */
  engagementRatio: number;
  touches: TouchRecordDto[];
}

export interface Session {
  childId: string;
  sessionNumber: number;
  food: string;
  foodId?: string;
  difficulty?: Difficulty;
  date: string;
  levels: LevelResult[];
}
