import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Caravan } from "./caravan.entity";
import { User }    from "./user.entity";

@Entity("caravan_photos")
export class CaravanPhoto {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "caravan_id", type: "uuid" })
  caravanId!: string;

  @ManyToOne(() => Caravan, { onDelete: "CASCADE" })
  @JoinColumn({ name: "caravan_id" })
  caravan!: Caravan;

  @Column({ type: "text" })
  url!: string;

  @Column({ name: "thumbnail_url", type: "text", nullable: true })
  thumbnailUrl!: string;

  @Column({ name: "original_name", type: "varchar", length: 300, nullable: true })
  originalName!: string;

  @Column({ name: "file_size_bytes", type: "integer", nullable: true })
  fileSizeBytes!: number;

  @Column({ name: "compressed_size_bytes", type: "integer", nullable: true })
  compressedSizeBytes!: number;

  @Column({ type: "varchar", length: 300, nullable: true })
  caption!: string;

  @Column({ name: "uploaded_by", type: "uuid", nullable: true })
  uploadedBy!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "uploaded_by" })
  uploader!: User;

  @Column({ name: "is_featured", type: "boolean", default: false })
  isFeatured!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
