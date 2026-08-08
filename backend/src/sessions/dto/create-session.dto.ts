/**
 * Forma e validazione della sessione in arrivo dal client.
 *
 * La validazione è ricorsiva fino al singolo contatto: un record malformato non
 * entra nel database. È una garanzia di integrità del dato clinico prima ancora
 * che una difesa di sicurezza — un valore sbagliato qui diventa un punto
 * sbagliato sul grafico di un bambino.
 *
 * @module
 */

import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/** Un singolo contatto con l'alimento, con tempi relativi al primo contatto. */
export class TouchRecordDto {
  /** Millisecondi trascorsi all'inizio del contatto. */
  @IsNumber()
  down!: number;

  /** Millisecondi trascorsi alla fine del contatto. */
  @IsNumber()
  up!: number;

  /** Durata del contatto in millisecondi. */
  @IsNumber()
  duration!: number;
}

/** Misurazioni di un livello. */
export class LevelResultMetricsDto {
  /** Numero di contatti registrati. */
  @IsInt()
  n!: number;

  /** Latenza del primo contatto in millisecondi; `null` se non ha mai toccato. */
  @IsOptional()
  @IsNumber()
  latencyMs!: number | null;

  /** Somma delle durate dei contatti. */
  @IsNumber()
  totalContactMs!: number;

  /** Durata media di un contatto; `null` senza contatti. */
  @IsOptional()
  @IsNumber()
  meanTouchMs!: number | null;

  /** Tempo medio fra un contatto e il successivo; `null` con meno di due contatti. */
  @IsOptional()
  @IsNumber()
  meanIrtMs!: number | null;

  /** Durata della finestra di misura. */
  @IsNumber()
  sessionDurationMs!: number;

  /** Percentuale di tempo a contatto: la metrica principale del programma. */
  @IsNumber()
  engagementRatio!: number;

  /** Dati grezzi, da cui ogni altra metrica si può ricalcolare. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TouchRecordDto)
  touches!: TouchRecordDto[];
}

/** Esito di un livello: identità del livello e sue misurazioni. */
export class LevelResultDto {
  /** Numero del livello. */
  @IsInt()
  levelId!: number;

  /** Nome del livello al momento dell'esecuzione. */
  @IsString()
  levelName!: string;

  /**
   * Definizione operazionale del comportamento misurato.
   *
   * Viene copiata nel record proprio perché resti leggibile anche se i livelli
   * dell'applicazione un domani cambiassero.
   */
  @IsString()
  behavior!: string;

  /** Meccanica del livello. */
  @IsIn(['count', 'hold'])
  mode!: 'count' | 'hold';

  /** Obiettivo del livello, in secondi. */
  @IsNumber()
  target!: number;

  /** Misurazioni ottenute. */
  @IsObject()
  @ValidateNested()
  @Type(() => LevelResultMetricsDto)
  metrics!: LevelResultMetricsDto;
}

/** Corpo della richiesta di salvataggio di una sessione. */
export class CreateSessionDto {
  /**
   * Bambino a cui attribuire la sessione.
   *
   * Facoltativo e comunque **ignorato**: il controller lo sostituisce con quello
   * del token.
   */
  @IsOptional()
  @IsString()
  childId?: string;

  /** Numero progressivo della sessione per quel bambino su quell'alimento. */
  @IsInt()
  @Min(1)
  sessionNumber!: number;

  /** Nome dell'alimento. */
  @IsString()
  food!: string;

  /** Identificativo dell'alimento; assente nelle versioni più vecchie del client. */
  @IsOptional()
  @IsString()
  foodId?: string;

  /** Condizione sperimentale della sessione. */
  @IsOptional()
  @IsIn(['facile', 'difficile'])
  difficulty?: 'facile' | 'difficile';

  /** Operatore che ha condotto la sessione. */
  @IsOptional()
  @IsString()
  therapist?: string;

  /** Identificativi dei comportamenti problema osservati. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  problemBehaviors?: string[];

  /** Osservazioni libere del terapista. */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Data e ora di inizio, in formato ISO 8601.
   *
   * Validata come data e non come stringa qualsiasi: è il campo con cui la
   * dashboard ordina e data le sedute, e una stringa non interpretabile
   * diventerebbe una `Invalid Date` a schermo mesi dopo, quando nessuno può più
   * sapere quale fosse la data giusta.
   */
  @IsISO8601()
  date!: string;

  /** Esito di ogni livello eseguito. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LevelResultDto)
  levels!: LevelResultDto[];
}
