import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ChildEntity } from './entities/child.entity';

/** Data-access service for child accounts; used exclusively by the auth layer. */
@Injectable()
export class ChildrenService {
  constructor(
    @InjectRepository(ChildEntity)
    private readonly childrenRepository: MongoRepository<ChildEntity>,
  ) {}

  /**
   * Finds a child by name (unique index), or returns `null` if not found.
   * @param name - Child identifier to look up.
   */
  findByName(name: string): Promise<ChildEntity | null> {
    return this.childrenRepository.findOneBy({ name });
  }

  /**
   * Creates and persists a new child account with an already-hashed password.
   * @param name - Unique child identifier.
   * @param passwordHash - bcrypt hash of the plain-text password.
   */
  create(name: string, passwordHash: string): Promise<ChildEntity> {
    const child = this.childrenRepository.create({ name, passwordHash });
    return this.childrenRepository.save(child);
  }
}
