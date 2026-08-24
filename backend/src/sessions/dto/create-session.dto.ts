import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

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
  count!: number;

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

  @IsIn(['hold'])
  mode!: 'hold';

  @IsNumber()
  target!: number;

  @IsObject()
  @ValidateNested()
  @Type(() => LevelResultMetricsDto)
  metrics!: LevelResultMetricsDto;
}

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  childId?: string;

  @IsInt()
  @Min(1)
  sessionNumber!: number;

  @IsString()
  @IsNotEmpty()
  food!: string;

  @IsString()
  @IsNotEmpty()
  foodId!: string;

  @IsIn(['facile', 'difficile'])
  difficulty!: 'facile' | 'difficile';

  @IsString()
  therapist!: string;

  @IsArray()
  @IsString({ each: true })
  problemBehaviors!: string[];

  @IsString()
  notes!: string;

  @IsISO8601()
  date!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LevelResultDto)
  levels!: LevelResultDto[];
}
