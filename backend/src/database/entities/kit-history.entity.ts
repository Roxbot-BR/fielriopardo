import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("kit_history")
export class KitHistory {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ name: "year_start" }) yearStart: number;
  @Column({ name: "year_end", nullable: true }) yearEnd: number;
  @Column({ default: "home" }) type: string; // home, away, third, goalkeeper, special
  @Column({ nullable: true }) manufacturer: string;
  @Column({ name: "era_label", nullable: true }) eraLabel: string;
  @Column() title: string;
  @Column({ nullable: true, type: "text" }) description: string;
  @Column({ nullable: true, type: "text", name: "image_url" }) imageUrl: string;
  @Column({ nullable: true, name: "source_credit" }) sourceCredit: string;
  @Column({ nullable: true, type: "text", name: "image_url_2" }) imageUrl2: string;
  @Column({ name: "is_published", default: true }) isPublished: boolean;
  @Column({ name: "display_order", nullable: true }) displayOrder: number;
  @CreateDateColumn({ name: "created_at" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt: Date;
}
