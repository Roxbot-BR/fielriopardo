import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("season_ranking")
export class SeasonRanking {
  @PrimaryGeneratedColumn("uuid")                   id!: string;
  @Column({ name: "user_id", type: "varchar" })     userId!: string;
  @ManyToOne(() => User) @JoinColumn({ name: "user_id" }) user!: User;
  @Column({ type: "varchar" })                      season!: string;
  @Column({ name: "total_points", default: 0 })     totalPoints!: number;
  @Column({ name: "games_played", default: 0 })     gamesPlayed!: number;
  @Column({ name: "games_won",    default: 0 })     gamesWon!: number;
  @Column({ name: "sole_wins",    default: 0 })     soleWins!: number;
  @Column({ nullable: true, type: "int" })           position!: number;
  @UpdateDateColumn({ name: "updated_at" })          updatedAt!: Date;
}
