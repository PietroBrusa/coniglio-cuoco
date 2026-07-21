import { Column, CreateDateColumn, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

// Nested sub-documents of a session: MongoDB stores them inside the same
// document, leveraging its native support for hierarchical data.

/** All times in ms, relative to the level start. */
export interface TouchRecord {
  down: number;
  up: number;
  duration: number;
}

export interface LevelResultMetrics {
  /** Total number of taps. */
  n: number;
  latencyMs: number | null;
  totalContactMs: number;
  meanTouchMs: number | null;
  /** Mean Inter-Response Time (ms), or `null` if fewer than 2 taps. */
  meanIrtMs: number | null;
  sessionDurationMs: number;
  /** `totalContactMs / sessionDurationMs × 100`. */
  engagementRatio: number;
  touches: TouchRecord[];
}

export interface LevelResult {
  levelId: number;
  levelName: string;
  /** Clinical behaviour stimulated by this level. */
  behavior: string;
  mode: 'count' | 'hold';
  target: number;
  metrics: LevelResultMetrics;
}

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
