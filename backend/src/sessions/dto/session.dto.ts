import { LevelResultDto } from './create-session.dto';

export class SessionDto {
  _id!: string;
  childId!: string;
  sessionNumber!: number;
  food!: string;
  foodId?: string;
  difficulty?: 'facile' | 'difficile';
  date!: string;
  levels!: LevelResultDto[];
  createdAt!: string;
}

export class DeleteResultDto {
  deleted!: boolean;
  id!: string;
}
