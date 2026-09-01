import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { KitsService } from "./kits.service";
import { KITS_DATA } from "./kits.seed";

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const svc = app.get(KitsService);
  const existing = await svc.findAll();
  if (existing.length > 0) {
    console.log(`Kit history already has ${existing.length} records, skipping seed.`);
    await app.close();
    return;
  }
  for (const kit of KITS_DATA) {
    await svc.create(kit);
  }
  console.log(`Seeded ${KITS_DATA.length} kit history records.`);
  await app.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
