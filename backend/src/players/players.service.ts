import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { Player } from "../database/entities/player.entity";

@Injectable()
export class PlayersService {
  constructor(@InjectRepository(Player) private repo: Repository<Player>) {}

  findAll(status?: string) {
    const where: any = status ? { status } : {};
    return this.repo.find({ where, order: { position: "ASC", number: "ASC", name: "ASC" } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  private sanitize(dto: Partial<Player>): Partial<Player> {
    const clean: any = { ...dto };
    for (const key of ["birthDate", "arrivedAt", "leftAt", "number"]) {
      if (clean[key] === "") clean[key] = null;
    }
    return clean;
  }

  create(dto: Partial<Player>) {
    return this.repo.save(this.repo.create(this.sanitize(dto)));
  }

  async update(id: string, dto: Partial<Player>) {
    await this.repo.update(id, this.sanitize(dto));
    return this.findById(id);
  }

  async remove(id: string) {
    await this.repo.update(id, { status: "sold" } as any);
    return { ok: true };
  }
}
