import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailService } from "./email.service";
import { EmailController } from "./email.controller";
import { EmailLog } from "../database/entities/email-log.entity";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([EmailLog])],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
