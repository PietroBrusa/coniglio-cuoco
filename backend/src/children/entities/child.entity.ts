import { Column, CreateDateColumn, Entity, Index, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

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
