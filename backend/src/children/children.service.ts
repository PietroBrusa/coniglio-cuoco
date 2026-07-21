import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ChildEntity } from './entities/child.entity';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectRepository(ChildEntity)
    private readonly childrenRepository: MongoRepository<ChildEntity>,
  ) {}

  findByName(name: string): Promise<ChildEntity | null> {
    return this.childrenRepository.findOneBy({ name });
  }

  /** `passwordHash` must already be hashed by the caller. */
  create(name: string, passwordHash: string): Promise<ChildEntity> {
    const child = this.childrenRepository.create({ name, passwordHash });
    return this.childrenRepository.save(child);
  }
}
