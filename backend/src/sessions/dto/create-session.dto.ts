import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

// Validated payload for `POST /sessions`, mirroring the frontend `Session`
// type: levels → metrics → touches.

export class TouchRecordDto {
  @IsNumber()
  down!: number;

  @IsNumber()
  up!: number;

  @IsNumber()
  duration!: number;
}

export class LevelResultMetricsDto {
  @IsInt()
  n!: number;

  @IsOptional()
  @IsNumber()
  latencyMs!: number | null;

  @IsNumber()
  totalContactMs!: number;

  @IsOptional()
  @IsNumber()
  meanTouchMs!: number | null;

  @IsOptional()
  @IsNumber()
  meanIrtMs!: number | null;

  @IsNumber()
  sessionDurationMs!: number;

  @IsNumber()
  engagementRatio!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TouchRecordDto)
  touches!: TouchRecordDto[];
}

export class LevelResultDto {
  @IsInt()
  levelId!: number;

  @IsString()
  levelName!: string;

  @IsString()
  behavior!: string;

  @IsIn(['count', 'hold'])
  mode!: 'count' | 'hold';

  @IsNumber()
  target!: number;

  @IsObject()
  @ValidateNested()
  @Type(() => LevelResultMetricsDto)
  metrics!: LevelResultMetricsDto;
}

export class CreateSessionDto {
  // Set server-side from the authenticated token; ignored if provided by the client.
  @IsOptional()
  @IsString()
  childId?: string;

  @IsInt()
  @Min(1)
  sessionNumber!: number;

  @IsString()
  food!: string;

  @IsOptional()
  @IsString()
  foodId?: string;

  @IsOptional()
  @IsIn(['facile', 'difficile'])
  difficulty?: 'facile' | 'difficile';

  @IsString()
  date!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LevelResultDto)
  levels!: LevelResultDto[];
}
