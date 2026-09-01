import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum Competition {
  BRASILEIRAO     = "BRASILEIRAO",
  COPA_DO_BRASIL  = "COPA_BRASIL",
  LIBERTADORES    = "LIBERTADORES",
  SULAMERICANA    = "SUL_AMERICANA",
  PAULISTAO       = "PAULISTAO",
  FRIENDLY        = "AMISTOSO",
  OTHER           = "OUTRO",
}

export enum MatchStatus {
  SCHEDULED  = "scheduled",
  LIVE       = "live",
  FINISHED   = "finished",
  CANCELLED  = "cancelled",
  POSTPONED  = "postponed",
}

@Entity("matches")
export class Match {
  @PrimaryGeneratedColumn("uuid")                              id!: string;
  @Column({ name: "external_id",    nullable: true, type: "varchar" }) externalId!: string;
  @Column({ type: "enum", enum: Competition, default: Competition.OTHER }) competition!: Competition;
  @Column({ type: "varchar" })                                 season!: string;
  @Column({ name: "round_number",   nullable: true, type: "int" })     roundNumber!: number;
  @Column({ name: "round_label",    nullable: true, type: "varchar" }) roundLabel!: string;
  @Column({ name: "home_team",      type: "varchar" })         homeTeam!: string;
  @Column({ name: "away_team",      type: "varchar" })         awayTeam!: string;
  @Column({ name: "home_team_logo", nullable: true, type: "varchar" }) homeTeamLogo!: string;
  @Column({ name: "away_team_logo", nullable: true, type: "varchar" }) awayTeamLogo!: string;
  @Column({ name: "match_date",     type: "timestamptz" })     matchDate!: Date;
  @Column({ nullable: true, type: "varchar" })                 stadium!: string;
  @Column({ nullable: true, type: "varchar" })                 city!: string;
  @Column({ name: "tv_channel",     nullable: true, type: "varchar" }) tvChannel!: string;
  @Column({ name: "radio_url",      nullable: true, type: "varchar" }) radioUrl!: string;
  @Column({ name: "stream_url", nullable: true, type: "varchar" }) streamUrl!: string;
  @Column({ type: "enum", enum: MatchStatus, default: MatchStatus.SCHEDULED }) status!: MatchStatus;
  @Column({ name: "home_score",     nullable: true, type: "int" })     homeScore!: number;
  @Column({ name: "away_score",     nullable: true, type: "int" })     awayScore!: number;
  @Column({ name: "bolao_closed_at",nullable: true, type: "timestamptz" }) bolaoClosedAt!: Date;
  @Column({ name: "bolao_open",     default: true })            bolaoOpen!: boolean;
  @Column({ name: "match_stats",    nullable: true, type: "jsonb" })   matchStats: any;
  @Column({ name: "match_events",   nullable: true, type: "jsonb" })   matchEvents: any;
  @Column({ name: "date_confirmed", default: true }) dateConfirmed!: boolean;
  @CreateDateColumn({ name: "created_at" })                    createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" })                    updatedAt!: Date;
}
