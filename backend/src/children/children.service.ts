/**
 * Accesso alla collezione dei bambini registrati.
 *
 * @module
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ChildEntity } from './entities/child.entity';

/**
 * Lettura e scrittura degli account.
 *
 * Non conosce le password in chiaro: riceve già l'impronta calcolata dal
 * servizio di autenticazione, che è l'unico a maneggiare la credenziale.
 */
@Injectable()
export class ChildrenService {
  constructor(
    @InjectRepository(ChildEntity)
    private readonly childrenRepository: MongoRepository<ChildEntity>,
  ) {}

  /**
   * Cerca un bambino per nome.
   *
   * @param name - Identificativo del bambino.
   * @returns Il bambino, `null` se non è registrato.
   */
  findByName(name: string): Promise<ChildEntity | null> {
    return this.childrenRepository.findOneBy({ name });
  }

  /**
   * Registra un nuovo bambino.
   *
   * @param name - Identificativo scelto.
   * @param passwordHash - Impronta bcrypt della password.
   * @returns Il documento creato.
   */
  create(name: string, passwordHash: string): Promise<ChildEntity> {
    const child = this.childrenRepository.create({ name, passwordHash });
    return this.childrenRepository.save(child);
  }
}
