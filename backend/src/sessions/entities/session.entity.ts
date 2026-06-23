import { Column, CreateDateColumn, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

// Nested sub-documents of a session: MongoDB stores them inside the same
// document, leveraging its native support for hierarchical data.

/** A single recorded touch event (timestamps and duration in ms). */
export interface TouchRecord {
  /** Time of press, relative to level start (ms). */
  down: number;
  /** Time of release, relative to level start (ms). */
  up: number;
  /** Contact duration: `up - down` (ms). */
  duration: number;
}

/** Persisted metrics for a completed level. */
export interface LevelResultMetrics {
  /** Total number of taps. */
  n: number;
  /** Latency to first tap press (ms), or `null` if no taps recorded. */
  latencyMs: number | null;
  /** Sum of all completed tap durations (ms). */
  totalContactMs: number;
  /** Mean tap duration (ms), or `null` if no taps. */
  meanTouchMs: number | null;
  /** Mean Inter-Response Time (ms), or `null` if fewer than 2 taps. */
  meanIrtMs: number | null;
  /** Total level duration (ms). */
  sessionDurationMs: number;
  /** Engagement Ratio: `totalContactMs / sessionDurationMs × 100`. */
  engagementRatio: number;
  touches: TouchRecord[];
}

/** Result of a single completed level: definition data and measured metrics. */
export interface LevelResult {
  levelId: number;
  levelName: string;
  /** Clinical behaviour stimulated by this level. */
  behavior: string;
  mode: 'count' | 'hold';
  target: number;
  metrics: LevelResultMetrics;
}

/** Complete game session document as persisted in MongoDB. */
@Entity({ name: 'sessions' })
export class SessionEntity {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column()
  childId!: string;

  @Column()
  sessionNumber!: number;

  @Column()
  food!: string;

  @Column()
  foodId!: string;

  @Column()
  difficulty!: 'facile' | 'difficile';

  @Column()
  date!: string;

  @Column()
  levels!: LevelResult[];

  @CreateDateColumn()
  createdAt!: Date;
}
