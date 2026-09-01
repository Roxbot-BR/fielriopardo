import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Caravan }        from "../database/entities/caravan.entity";
import { CaravanPhoto }   from "../database/entities/caravan-photo.entity";
import { GalleryPhoto }   from "../database/entities/gallery-photo.entity";
import { CaravansService }    from "./caravans.service";
import { CaravansController } from "./caravans.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Caravan, CaravanPhoto, GalleryPhoto])],
  controllers: [CaravansController],
  providers: [CaravansService],
  exports: [CaravansService],
})
export class CaravansModule {}
