import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { KitHistory } from "../database/entities/kit-history.entity";

@Injectable()
export class KitsService {
  constructor(@InjectRepository(KitHistory) private repo: Repository<KitHistory>) {}

  findAll(type?: string) {
    const qb = this.repo.createQueryBuilder("k").where("k.is_published = true");
    if (type && type !== "all") qb.andWhere("k.type = :type", { type });
    return qb.orderBy("k.year_start", "ASC").addOrderBy("k.display_order", "ASC", "NULLS LAST").getMany();
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(dto: Partial<KitHistory>) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<KitHistory>) {
    await this.repo.update(id, dto);
    return this.findById(id);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { deleted: true };
  }

  async findAllAdmin() {
    return this.repo.createQueryBuilder("k").orderBy("k.year_start", "ASC").getMany();
  }
}
