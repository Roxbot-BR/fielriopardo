import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("players")
export class Player {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() name: string;
  @Column({ nullable: true }) number: number;
  @Column({ nullable: true }) position: string;    // GK, DF, MF, FW
  @Column({ nullable: true }) nationality: string;
  @Column({ nullable: true, type: "date", name: "birth_date" }) birthDate: string;
  @Column({ nullable: true }) height: string;      // ex: "1,85m"
  @Column({ nullable: true }) weight: string;      // ex: "82kg"
  @Column({ nullable: true, type: "text", name: "image_url" }) imageUrl: string;
  @Column({ nullable: true, type: "text" }) bio: string;
  @Column({ default: "active" }) status: string;  // active, loaned, sold
  @Column({ nullable: true, type: "date", name: "arrived_at" }) arrivedAt: string;
  @Column({ nullable: true, type: "date", name: "left_at" }) leftAt: string;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt: Date;
}
