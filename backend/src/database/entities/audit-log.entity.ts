import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: "user_id", nullable: true, type: "varchar" }) userId!: string;
  @Column({ type: "varchar" }) action!: string;
  @Column({ type: "varchar" }) module!: string;
  @Column({ nullable: true, type: "text" }) description!: string;
  @Column({ name: "ip_address", nullable: true, type: "varchar" }) ipAddress!: string;
  @Column({ name: "user_agent", nullable: true, type: "text" }) userAgent!: string;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" }) @JoinColumn({ name: "user_id" }) user!: User;
}
