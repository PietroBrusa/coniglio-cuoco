export interface Food {
  id: string;
  label: string;
  emoji: string;
}

export type LevelMode = 'count' | 'hold';

export type Difficulty = 'facile' | 'difficile';

export type BeatScore = 'tap' | 'hold';

export interface HardBeat {
  onMs: [number, number];
  offMs: [number, number];
  score: BeatScore;
}

export interface Level {
  id: number;
  name: string;
  behavior: string;
  mode: LevelMode;
  target: number;
  hardBeat: HardBeat;
  intro: (ctx: { foodLabel: string }) => string;
  hint: string;
  progressLabel: (done: number, target: number) => string;
}

export type RabbitMood = 'idle' | 'happy' | 'sniff' | 'eat' | 'cheer';

import type { TouchRecordDto, LevelResultMetricsDto, LevelResultDto } from './api/generated';
export type TouchRecord = TouchRecordDto;
export type LevelResultMetrics = LevelResultMetricsDto;
export type LevelResult = LevelResultDto;

export interface Metrics {
  count: number;
  latencyMs: number | null;
  totalContactMs: number;
  liveContactMs: number;
  meanTouchMs: number | null;
  meanIrtMs: number | null;
  sessionDurationMs: number;
  engagementRatio: number;
  touches: TouchRecordDto[];
}

export interface Session {
  childId: string;
  sessionNumber: number;
  food: string;
  foodId?: string;
  difficulty?: Difficulty;
  therapist?: string;
  problemBehaviors?: string[];
  notes?: string;
  date: string;
  levels: LevelResult[];
}
