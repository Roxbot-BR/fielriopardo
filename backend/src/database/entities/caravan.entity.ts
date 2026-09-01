import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Match } from "./match.entity";

@Entity("caravans")
export class Caravan {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ name: "match_id", type: "uuid", nullable: true })
  matchId!: string;

  @ManyToOne(() => Match, { nullable: true, eager: false })
  @JoinColumn({ name: "match_id" })
  match!: Match;

  @Column({ name: "departure_city", type: "varchar", length: 100 })
  departureCity!: string;

  @Column({ name: "departure_point", type: "text" })
  departurePoint!: string;

  @Column({ name: "departure_datetime", type: "timestamptz" })
  departureDatetime!: Date;

  @Column({ name: "return_datetime", type: "timestamptz", nullable: true })
  returnDatetime!: Date;

  @Column({ type: "numeric", precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ type: "int", default: 50 })
  capacity!: number;

  @Column({ name: "spots_taken", type: "int", default: 0 })
  spotsTaken!: number;

  @Column({ type: "varchar", length: 20, default: "open" })
  status!: string;

  @Column({ name: "contact_whatsapp", type: "varchar", length: 30, nullable: true })
  contactWhatsapp!: string;

  @Column({ name: "contact_name", type: "varchar", length: 100, nullable: true })
  contactName!: string;

  @Column({ name: "cover_image", type: "text", nullable: true })
  coverImage!: string;

  @Column({ name: "cover_image_position", type: "varchar", length: 20, nullable: true, default: "50% 50%" })
  coverImagePosition!: string;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdBy!: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: "created_by" })
  creator!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
