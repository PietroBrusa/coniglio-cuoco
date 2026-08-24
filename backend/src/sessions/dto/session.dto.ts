import { LevelResultDto } from './create-session.dto';
import { SessionEntity } from '../entities/session.entity';

export class SessionDto {
  _id!: string;

  childId!: string;

  sessionNumber!: number;

  food!: string;

  foodId!: string;

  difficulty!: 'facile' | 'difficile';

  therapist!: string;

  problemBehaviors!: string[];

  notes!: string;

  date!: string;

  levels!: LevelResultDto[];

  createdAt!: string;
}

//L'entità ha _id: ObjectId e createdAt: Date, il DTO li dichiara string: la
//conversione va fatta qui, non lasciata al JSON.stringify implicito di Mongo.
export function toSessionDto(entity: SessionEntity): SessionDto {
  return {
    _id: entity._id.toString(),
    childId: entity.childId,
    sessionNumber: entity.sessionNumber,
    food: entity.food,
    foodId: entity.foodId,
    difficulty: entity.difficulty,
    therapist: entity.therapist,
    problemBehaviors: entity.problemBehaviors,
    notes: entity.notes,
    date: entity.date,
    levels: entity.levels,
    createdAt: entity.createdAt.toISOString(),
  };
}

export class DeleteResultDto {
  deleted!: boolean;

  id!: string;
}
