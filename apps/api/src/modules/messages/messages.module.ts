import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { AblyTokenService } from './ably-token.service';
import { CollaborationsModule } from '../collaborations/collaborations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), CollaborationsModule],
  controllers: [MessagesController],
  providers: [MessagesService, AblyTokenService],
  exports: [MessagesService],
})
export class MessagesModule {}
