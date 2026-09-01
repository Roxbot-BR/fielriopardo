import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { existsSync, mkdirSync } from "fs";
import { PlayersService } from "./players.service";
import { Public } from "../common/decorators/public.decorator";
import { Player } from "../database/entities/player.entity";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("players")
export class PlayersController {
  constructor(private svc: PlayersService) {}

  @Public()
  @Get()
  findAll(@Query("status") status?: string) {
    return this.svc.findAll(status ?? "active");
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.svc.findById(id);
  }

  @Post("upload")
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("ADMIN")
  @UseInterceptors(FileInterceptor("file", {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = "/app/uploads/players";
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { url: "/uploads/players/" + file.filename };
  }

  @Post()
  create(@Body() dto: Partial<Player>) {
    return this.svc.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: Partial<Player>) {
    return this.svc.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.svc.remove(id);
  }
}
