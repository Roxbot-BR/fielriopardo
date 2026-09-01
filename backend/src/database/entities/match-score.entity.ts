import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Match } from './match.entity';

@Entity('match_scores')
export class MatchScore {
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

  @Column({ default: 0 })
  points: number;

  @Column({ name: 'is_sole_winner', default: false })
  isSoleWinner: boolean;

  @Column({ name: 'predicted_home' })
  predictedHome: number;

  @Column({ name: 'predicted_away' })
  predictedAway: number;

  @Column({ name: 'actual_home' })
  actualHome: number;

  @Column({ name: 'actual_away' })
  actualAway: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
