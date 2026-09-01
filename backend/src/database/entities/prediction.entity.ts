import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Match } from './match.entity';

@Entity('predictions')
@Unique(['userId', 'matchId'])
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'match_id' })
  matchId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'home_score' })
  homeScore: number;

  @Column({ name: 'away_score' })
  awayScore: number;

  @Column({ name: 'change_count', default: 0 })
  changeCount: number;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
