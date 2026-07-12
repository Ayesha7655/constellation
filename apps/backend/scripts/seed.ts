import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedAppModule } from '../src/modules/seed/seed-app.module';
import { SeedOrchestratorService } from '../src/modules/seed/seed-orchestrator.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeedAppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const orchestrator = app.get(SeedOrchestratorService);
    await orchestrator.run(process.argv.slice(2));
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  Logger.error('Seed failed:', error);
  process.exit(1);
});
