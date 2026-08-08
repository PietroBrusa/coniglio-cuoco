import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChildrenService } from './children.service';
import { ChildEntity } from './entities/child.entity';

/**
 * Modulo degli account.
 *
 * Espone solo il servizio, non un controller: i bambini si creano unicamente
 * attraverso la registrazione, non esiste una rotta che li elenchi.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ChildEntity])],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}
