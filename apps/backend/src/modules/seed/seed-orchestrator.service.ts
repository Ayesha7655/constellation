import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { SeedRegistryService } from './seed-registry.service';
import type { DbSeeder } from './types/db-seeder.interface';
import { assertSeedAllowed } from './utils/assert-seed-allowed';
import { resetDatabase } from './utils/reset-database';

const SKIP_RESET_FLAG = '--skip-reset';

@Injectable()
export class SeedOrchestratorService {
  private readonly logger = new Logger(SeedOrchestratorService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly seedRegistry: SeedRegistryService,
  ) {}

  async run(argv: readonly string[]): Promise<void> {
    assertSeedAllowed();

    const { skipReset, filterNames } = this.parseArgs(argv);
    const selected = this.resolveSeeders(filterNames);

    if (!skipReset) {
      this.logger.log('→ reset: drop public schema and rerun SQL migrations');
      resetDatabase();

      this.logger.log('→ clean: delete all Firebase Auth users');
      const deleted = await this.firebaseService.deleteAllAuthUsers();
      this.logger.log(`Firebase users deleted: ${deleted}`);
    }

    for (const seeder of selected) {
      this.logger.log(`→ ${seeder.name}: ${seeder.description}`);
      await seeder.run();
    }
  }

  private parseArgs(argv: readonly string[]) {
    const skipReset = argv.includes(SKIP_RESET_FLAG);
    const filterNames = argv
      .filter((arg) => arg !== SKIP_RESET_FLAG)
      .map((name) => name.trim())
      .filter(Boolean);
    return { skipReset, filterNames };
  }

  private resolveSeeders(filterNames: readonly string[]): DbSeeder[] {
    const seeders = this.seedRegistry.list();
    if (filterNames.length === 0) {
      return [...seeders];
    }

    const known = new Set(seeders.map((seeder) => seeder.name));
    const unknown = filterNames.filter((name) => !known.has(name));
    if (unknown.length > 0) {
      throw new Error(`Unknown seeder(s): ${unknown.join(', ')}. Available: ${[...known].join(', ')}`);
    }

    return seeders.filter((seeder) => filterNames.includes(seeder.name));
  }
}
