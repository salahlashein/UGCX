import { Module } from '@nestjs/common';
import { R2StorageClient } from './r2-storage.client';

@Module({
  providers: [R2StorageClient],
  exports: [R2StorageClient],
})
export class R2StorageModule {}
