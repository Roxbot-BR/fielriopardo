import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("gallery_photos")
export class GalleryPhoto {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "text" })
  url!: string;

  @Column({ type: "varchar", length: 50, default: "geral" })
  category!: string;

  @Column({ name: "is_featured", type: "boolean", default: false })
  isFeatured!: boolean;

  @Column({ name: "uploaded_by", type: "uuid", nullable: true })
  uploadedBy!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "uploaded_by" })
  uploader!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
