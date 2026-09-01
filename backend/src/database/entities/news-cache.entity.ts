import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("news_cache")
export class NewsCache {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ nullable: true, type: "text" }) summary: string;
  @Column({ nullable: true, type: "text" }) content: string;
  @Column({ name: "source_url", nullable: true }) sourceUrl: string;
  @Column({ name: "image_url", nullable: true }) imageUrl: string;
  @Column({ type: "varchar", default: "geral" }) category: string;
  @Column({ name: "is_approved", default: true }) isApproved: boolean;
  @Column({ name: "published_at", nullable: true, type: "timestamp with time zone" }) publishedAt: Date;
  @CreateDateColumn({ name: "fetched_at" }) fetchedAt: Date;
  @Column({ name: "is_deleted", default: false }) isDeleted: boolean;
}
