//Tipi di dati

//Cibo selezionato
export interface Food {
  //riferimento
  id: string;
  //dati per UI
  label: string;
  emoji: string;
}

//Meccanica di gioco (tener premuto)
export type LevelMode = 'hold';

//Difficoltà di gioco
export type Difficulty = 'facile' | 'difficile';

//Modalità di gioco in difficile
export type BeatScore = 'tap' | 'hold';

//Configurazione meccanica di ritmo (modalità hard)
export interface HardBeat {
  //range in cui la finestra dove si può premere rimane accesa
  onMs: [number, number]; //tempo dove la finestra è accesa
  offMs: [number, number]; //tempo dove la finestra è spenta
  //tipologia spiegata sopra
  score: BeatScore;
  //quante finestre devo "prendere" per finire il livello
  beatTarget: number;
}

//Livello
export interface Level {
  id: number;

  name: string;
  behavior: string;
  mode: LevelMode;
  //durata del livello/quanto serve per completare il livello al 100%
  target: number;
  //dato modalità hard
  hardBeat: HardBeat;
  //testo fase inizio
  intro: (ctx: { foodLabel: string }) => string;
  //consigli mostrati a schermo
  hint: string;
  //in easy mode indica il progresso della barra
  progressLabel: (done: number, target: number) => string;
}

//Stati coniglio, usati per gestire l'animazione
export type RabbitMood = 'idle' | 'happy' | 'sniff' | 'eat' | 'cheer';

//Import da openApi
import type { TouchRecordDto, LevelResultMetricsDto, LevelResultDto } from '@/api/generated';

//Assegnazione nomi
export type TouchRecord = TouchRecordDto;
export type LevelResultMetrics = LevelResultMetricsDto;
export type LevelResult = LevelResultDto;

//Metriche calcolate seguendo i concetti ABA
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

//Record di una sessione di terapia
export interface Session {
  childId: string;
  sessionNumber: number;
  food: string;
  foodId: string;
  difficulty: Difficulty;
  therapist: string;
  problemBehaviors: string[];
  notes: string;
  date: string;
  levels: LevelResult[];
}
