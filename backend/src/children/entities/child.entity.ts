/**
 * Documento di un bambino registrato.
 *
 * @module
 */

import { Column, CreateDateColumn, Entity, Index, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

/** Un account nella collezione `children`. */
@Entity({ name: 'children' })
export class ChildEntity {
  /** Identificativo assegnato da MongoDB. */
  @ObjectIdColumn()
  _id!: ObjectId;

  /**
   * Identificativo del bambino, usato come nome utente.
   *
   * L'indice univoco impedisce due account con lo stesso nome anche in caso di
   * registrazioni simultanee, che il solo controllo applicativo non fermerebbe.
   */
  @Index({ unique: true })
  @Column()
  name!: string;

  /** Impronta bcrypt della password: la credenziale in chiaro non viene mai memorizzata. */
  @Column()
  passwordHash!: string;

  /** Data di registrazione, assegnata dal server. */
  @CreateDateColumn()
  createdAt!: Date;
}
