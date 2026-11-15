import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Collaboration } from '../collaborations/entities/collaboration.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ChatsController } from './chats.controller';
import { AblyTokenService } from './ably-token.service';
import { CollaborationsModule } from '../collaborations/collaborations.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Collaboration]),
    forwardRef(() => CollaborationsModule),
    NotificationsModule,
  ],
  controllers: [MessagesController, ChatsController],
  providers: [MessagesService, AblyTokenService],
  exports: [MessagesService],
})
export class MessagesModule {}
