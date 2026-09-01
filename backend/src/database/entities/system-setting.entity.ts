import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from "typeorm";

@Entity("system_settings")
export class SystemSetting {
  @PrimaryGeneratedColumn("uuid")                        id!: string;
  @Column({ unique: true, type: "varchar" })             key!: string;
  @Column({ nullable: true, type: "text" })              value!: string;
  @Column({ nullable: true, type: "varchar" })           description!: string;
  @Column({ nullable: true, type: "varchar" })           category!: string;
  @Column({ name: "is_public", default: false })         isPublic!: boolean;
  @Column({ name: "updated_by", nullable: true, type: "varchar" }) updatedBy!: string;
  @UpdateDateColumn({ name: "updated_at" })              updatedAt!: Date;
}
