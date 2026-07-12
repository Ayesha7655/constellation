import { Module } from '@nestjs/common';
import { CommonServicesModule } from '../../common/common-services.module';
import { DatabaseModule } from '../../database/database.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { SessionModule } from '../session/session.module';
import { AdminRolesService } from './admin-roles.service';
import { AdminUsersService } from './admin-users.service';
import { AdminController } from './admin.controller';
import { SuperAdminSeeder } from './seeders/super-admin.seeder';

@Module({
  imports: [CommonServicesModule, DatabaseModule, FirebaseModule, SessionModule],
  controllers: [AdminController],
  providers: [AdminRolesService, AdminUsersService, SuperAdminSeeder],
  exports: [SuperAdminSeeder],
})
export class AdminModule {}
