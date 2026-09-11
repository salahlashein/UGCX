import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { R2StorageClient } from './r2-storage.client';

@Module({
  controllers: [StorageController],
  providers: [R2StorageClient],
  exports: [R2StorageClient],
})
export class StorageModule {}
