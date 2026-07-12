import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController, OrganizationsController],
  providers: [UsersService, OrganizationsService],
  exports: [UsersService, OrganizationsService],
})
export class UsersModule {}
