import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn()                         id!: number;
  @Column({ type: "varchar" })                      module!: string;
  @Column({ type: "varchar" })                      action!: string;
  @Column({ nullable: true, type: "varchar" })      description!: string;
}
