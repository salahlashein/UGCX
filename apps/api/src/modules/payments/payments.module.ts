import { forwardRef, Module } from '@nestjs/common';
import { PaymobClient } from './paymob.client';
import { PaymobWebhookController } from './paymob-webhook.controller';
import { CollaborationsModule } from '../collaborations/collaborations.module';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  // forwardRef: CollaborationsModule & CampaignsModule also import PaymentsModule (for
  // PaymobClient), so this is a legitimate circular dependency.
  imports: [
    forwardRef(() => CollaborationsModule),
    forwardRef(() => CampaignsModule),
  ],
  controllers: [PaymobWebhookController],
  providers: [PaymobClient],
  exports: [PaymobClient],
})
export class PaymentsModule {}
