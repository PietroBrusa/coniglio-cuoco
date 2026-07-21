import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChildrenService } from './children.service';
import { ChildEntity } from './entities/child.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChildEntity])],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}
