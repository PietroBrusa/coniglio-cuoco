import { Column, CreateDateColumn, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

export interface TouchRecord {
  down: number;
  up: number;
  duration: number;
}

export interface LevelResultMetrics {
  count: number;
  latencyMs: number | null;
  totalContactMs: number;
  meanTouchMs: number | null;
  meanIrtMs: number | null;
  sessionDurationMs: number;
  engagementRatio: number;
  touches: TouchRecord[];
}

export interface LevelResult {
  levelId: number;
  levelName: string;
  behavior: string;
  mode: 'hold';
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
  therapist!: string;

  @Column()
  problemBehaviors!: string[];

  @Column()
  notes!: string;

  @Column()
  date!: string;

  @Column()
  levels!: LevelResult[];

  @CreateDateColumn()
  createdAt!: Date;
}
