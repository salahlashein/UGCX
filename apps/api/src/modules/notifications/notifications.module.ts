import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ExpoPushClient } from './expo-push.client';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { BrandMember } from '../brands/entities/brand-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, BrandMember]),
    UsersModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, ExpoPushClient],
  exports: [NotificationsService, ExpoPushClient],
})
export class NotificationsModule {}
