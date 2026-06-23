import { Column, CreateDateColumn, Entity, Index, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

/** Child account document: unique name and bcrypt-hashed password. */
@Entity({ name: 'children' })
export class ChildEntity {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Index({ unique: true })
  @Column()
  name!: string;

  @Column()
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
