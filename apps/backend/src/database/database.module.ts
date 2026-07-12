import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { PermissionsService } from './permissions.service';
import {
  Organization,
  Permission,
  PermissionCategory,
  Role,
  RolePermission,
  User,
  UserRole,
  UserSession,
} from './models';

const models = [Organization, Role, PermissionCategory, Permission, RolePermission, User, UserRole, UserSession];

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        uri: configService.getOrThrow<string>('DATABASE_URL'),
        models,
        autoLoadModels: false,
        logging: configService.get<string>('SEQUELIZE_LOG_QUERIES') === 'true' ? console.log : false,
      }),
    }),
    SequelizeModule.forFeature(models),
  ],
  providers: [PermissionsService],
  exports: [SequelizeModule, PermissionsService],
})
export class DatabaseModule {}
