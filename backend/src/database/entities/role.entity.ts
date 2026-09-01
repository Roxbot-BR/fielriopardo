import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { Permission } from "./permission.entity";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn()                         id!: number;
  @Column({ unique: true, type: "varchar" })        name!: string;
  @Column({ nullable: true, type: "varchar" })      description!: string;
  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({ name: "role_permissions", joinColumn: { name: "role_id" }, inverseJoinColumn: { name: "permission_id" } })
  permissions!: Permission[];
}
