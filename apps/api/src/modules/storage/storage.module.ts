import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageController } from './storage.controller';
import { R2StorageModule } from './r2-storage.module';
import { CollaborationsModule } from '../collaborations/collaborations.module';
import { Deliverable } from '../deliverables/entities/deliverable.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deliverable]),
    R2StorageModule,
    CollaborationsModule,
  ],
  controllers: [StorageController],
  exports: [R2StorageModule],
})
export class StorageModule {}
