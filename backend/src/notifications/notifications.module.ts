import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushSubscription } from '../database/entities/push-subscription.entity';
import { PushNotificationLog } from '../database/entities/push-notification-log.entity';
import { NotificationHistory } from '../database/entities/notification-history.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscription, PushNotificationLog, NotificationHistory]), SettingsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
