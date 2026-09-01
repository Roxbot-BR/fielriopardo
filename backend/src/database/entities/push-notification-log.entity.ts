import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm';

export type NotificationType =
  | 'bolao_open'
  | 'bolao_close'
  | 'reminder_2h'
  | 'reminder_1h'
  | 'reminder_30m'
  | 'reminder_5m'
  | 'match_result'
  | 'game_day'
  | 'birthday'
  | 'welcome';

@Entity('push_notification_logs')
@Unique(['matchId', 'userId', 'type'])
export class PushNotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'match_id', type: 'varchar', length: 100 })
  matchId: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar' })
  type: NotificationType;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}
