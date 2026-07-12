import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { SeedOrchestratorService } from './seed-orchestrator.service';
import { SeedRegistryService } from './seed-registry.service';

@Module({
  imports: [FirebaseModule, AdminModule],
  providers: [SeedRegistryService, SeedOrchestratorService],
  exports: [SeedOrchestratorService],
})
export class SeedModule {}
