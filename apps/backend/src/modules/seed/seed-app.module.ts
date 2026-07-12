import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { PermissionsModule } from '../../common/permissions/permissions.module';
import { SeedModule } from './seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    PermissionsModule,
    SeedModule,
  ],
})
export class SeedAppModule {}
