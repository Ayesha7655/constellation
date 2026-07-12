import { Injectable } from '@nestjs/common';
import { SuperAdminSeeder } from '../admin/seeders/super-admin.seeder';
import type { DbSeeder } from './types/db-seeder.interface';

@Injectable()
export class SeedRegistryService {
  constructor(private readonly superAdminSeeder: SuperAdminSeeder) {}

  list(): DbSeeder[] {
    return [this.superAdminSeeder];
  }
}
