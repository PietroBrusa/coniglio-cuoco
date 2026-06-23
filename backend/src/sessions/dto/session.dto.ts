import { LevelResultDto } from './create-session.dto';

/** A saved session document as returned by the API. */
export class SessionDto {
  /** MongoDB ObjectId of the session. */
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

/** Deletion result returned after a successful `DELETE /sessions/:id`. */
export class DeleteResultDto {
  deleted!: boolean;
  id!: string;
}
