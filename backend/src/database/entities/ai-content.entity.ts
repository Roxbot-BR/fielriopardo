import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ai_content')
export class AiContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column({ name: 'match_id', nullable: true })
  matchId: string;

  @Column({ name: 'content_json', type: 'jsonb' })
  contentJson: any;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;
}
