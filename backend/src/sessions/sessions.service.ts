import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { SessionEntity } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: MongoRepository<SessionEntity>,
  ) {}

  create(dto: CreateSessionDto): Promise<SessionEntity> {
    const session = this.sessionsRepository.create(dto);
    return this.sessionsRepository.save(session);
  }

  findByChild(childId: string): Promise<SessionEntity[]> {
    return this.sessionsRepository.find({
      where: { childId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForChild(id: string, childId: string): Promise<SessionEntity> {
    if (!ObjectId.isValid(id)) throw new NotFoundException('Invalid session ID');
    const session = await this.sessionsRepository.findOneBy({ _id: new ObjectId(id) });
    if (!session || session.childId !== childId) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  async removeForChild(
    id: string,
    childId: string,
  ): Promise<{
    deleted: true;
    id: string;
  }> {
    await this.findOneForChild(id, childId);
    await this.sessionsRepository.deleteOne({ _id: new ObjectId(id) });
    return { deleted: true, id };
  }
}
