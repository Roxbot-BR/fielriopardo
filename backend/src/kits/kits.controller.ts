import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import { KitsService } from "./kits.service";
import { Public } from "../common/decorators/public.decorator";
import { KitHistory } from "../database/entities/kit-history.entity";

@Controller("kits")
export class KitsController {
  constructor(private svc: KitsService) {}

  @Public()
  @Get()
  findAll(@Query("type") type?: string) {
    return this.svc.findAll(type);
  }

  @Get("admin/all")
  findAllAdmin() {
    return this.svc.findAllAdmin();
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.svc.findById(id);
  }

  @Post()
  create(@Body() dto: Partial<KitHistory>) {
    return this.svc.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: Partial<KitHistory>) {
    return this.svc.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.svc.remove(id);
  }

  @Post("upload-image")
  @UseInterceptors(FileInterceptor("file", {
    storage: diskStorage({
      destination: "/app/uploads/kits",
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || ".jpg";
        const name = Date.now() + "-" + Math.round(Math.random() * 1e6) + ext;
        cb(null, name);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Apenas imagens são permitidas"), false);
    },
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { url: "/uploads/kits/" + file.filename };
  }
}
