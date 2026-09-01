import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ unique: true })
  endpoint: string;

  @Column({ name: 'p256dh_key' })
  p256dhKey: string;

  @Column({ name: 'auth_key' })
  authKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
