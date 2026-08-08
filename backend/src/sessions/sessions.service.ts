/**
 * Accesso alla collezione delle sessioni.
 *
 * @module
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { SessionEntity } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';

/**
 * Lettura e scrittura delle sessioni, sempre ristrette a un bambino.
 *
 * Non esiste un metodo che restituisca sessioni senza filtrarle per
 * proprietario: l'isolamento dei dati è una proprietà della classe, non una
 * disciplina di chi la usa.
 */
@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: MongoRepository<SessionEntity>,
  ) {}

  /**
   * Salva una sessione.
   *
   * @param dto - Sessione già validata, con il bambino imposto dal controller.
   * @returns Il documento creato.
   */
  create(dto: CreateSessionDto): Promise<SessionEntity> {
    const session = this.sessionsRepository.create(dto);
    return this.sessionsRepository.save(session);
  }

  /**
   * Elenca le sessioni di un bambino.
   *
   * @param childId - Bambino autenticato.
   * @returns Le sue sessioni, dalla più recente secondo l'orologio del server.
   */
  findByChild(childId: string): Promise<SessionEntity[]> {
    return this.sessionsRepository.find({
      where: { childId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Restituisce una sessione, verificando che appartenga al bambino.
   *
   * Un identificativo malformato e una sessione altrui producono lo stesso
   * errore di una inesistente: da fuori non si distingue il caso «non esiste»
   * dal caso «non è tua», quindi non si può sondare il database per scoprire
   * quali sessioni esistano.
   *
   * @param id - Identificativo della sessione.
   * @param childId - Bambino autenticato.
   * @returns La sessione.
   * @throws NotFoundException se manca, è malformata o è di un altro bambino.
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
   * Cancella una sessione del bambino autenticato.
   *
   * La verifica di appartenenza precede la cancellazione ed è la stessa della
   * lettura, così non esiste un percorso che cancelli senza controllare.
   *
   * @param id - Identificativo della sessione.
   * @param childId - Bambino autenticato.
   * @returns Conferma della cancellazione.
   * @throws NotFoundException se la sessione non esiste o non gli appartiene.
   */
  async removeForChild(
    id: string,
    childId: string,
  ): Promise<{
    /** Sempre `true`: un fallimento arriva come errore HTTP. */
    deleted: true;
    /** Identificativo della sessione cancellata. */
    id: string;
  }> {
    await this.findOneForChild(id, childId);
    await this.sessionsRepository.deleteOne({ _id: new ObjectId(id) });
    return { deleted: true, id };
  }
}
