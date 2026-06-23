import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { SessionEntity } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';

/** MongoDB persistence for sessions, with ownership checks on every operation. */
@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: MongoRepository<SessionEntity>,
  ) {}

  /**
   * Persists a new session document.
   * @param dto - Validated session payload (with `childId` injected from the JWT).
   */
  create(dto: CreateSessionDto): Promise<SessionEntity> {
    const session = this.sessionsRepository.create(dto);
    return this.sessionsRepository.save(session);
  }

  /**
   * Returns all sessions belonging to the given child, most recent first.
   * @param childId - Child identifier extracted from the JWT.
   */
  findByChild(childId: string): Promise<SessionEntity[]> {
    return this.sessionsRepository.find({
      where: { childId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Finds a session by id and verifies it belongs to `childId`.
   * @param id - MongoDB ObjectId string.
   * @param childId - Expected owner, extracted from the JWT.
   * @throws {NotFoundException} If the id is invalid, the document does not exist,
   *   or it belongs to a different child.
   */
  async findOneForChild(id: string, childId: string): Promise<SessionEntity> {
    if (!ObjectId.isValid(id)) throw new NotFoundException('Invalid session ID');
    const session = await this.sessionsRepository.findOneBy({ _id: new ObjectId(id) });
    if (!session || session.childId !== childId) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  /**
   * Deletes a session after verifying ownership.
   * @param id - MongoDB ObjectId string of the session to delete.
   * @param childId - Expected owner, extracted from the JWT.
   * @throws {NotFoundException} Propagated from {@link findOneForChild}.
   */
  async removeForChild(id: string, childId: string): Promise<{ deleted: true; id: string }> {
    await this.findOneForChild(id, childId);
    await this.sessionsRepository.deleteOne({ _id: new ObjectId(id) });
    return { deleted: true, id };
  }
}
