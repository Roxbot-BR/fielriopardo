import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('team_logos')
export class TeamLogo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'team_name', type: 'varchar', length: 255 })
  teamName: string;

  @Column({ name: 'team_slug', type: 'varchar', length: 255, unique: true })
  teamSlug: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string;

  @Column({ name: 'logo_data', type: 'text', nullable: true })
  logoData: string | null; // base64 image data

  @Column({ type: 'varchar', length: 50, nullable: true })
  source: string; // 'espn', 'wikimedia', 'upload', etc

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
