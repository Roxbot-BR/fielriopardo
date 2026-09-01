import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join("/app/uploads"), { prefix: "/uploads/" });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000", credentials: true });
  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Backend running on port ${process.env.PORT ?? 3001}`);
}
bootstrap();
