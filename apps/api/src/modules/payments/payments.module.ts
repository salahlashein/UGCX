import { forwardRef, Module } from '@nestjs/common';
import { PaymobClient } from './paymob.client';
import { PaymobWebhookController } from './paymob-webhook.controller';
import { CollaborationsModule } from '../collaborations/collaborations.module';

@Module({
  // forwardRef: CollaborationsModule also imports PaymentsModule (for
  // PaymobClient, used by the accept-proposal flow), so this pair is a
  // legitimate two-way dependency (standard NestJS circular-module pattern).
  imports: [forwardRef(() => CollaborationsModule)],
  controllers: [PaymobWebhookController],
  providers: [PaymobClient],
  exports: [PaymobClient],
})
export class PaymentsModule {}
