import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'to_email' })
  toEmail: string;

  @Column({ name: 'to_name', nullable: true })
  toName: string;

  @Column()
  subject: string;

  @Column({ default: 'general' })
  type: string;

  @Column({ default: 'sent' })
  status: string;

  @Column({ default: false })
  opened: boolean;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: true })
  openedAt: Date | null;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ nullable: true, type: 'text' })
  body: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
