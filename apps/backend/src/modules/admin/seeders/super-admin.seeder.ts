import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { SUPER_ADMIN_ROLE_KEY } from '../../../common/permissions/role-permissions.catalog';
import { ROLE_KEY_ATTRS } from '../../../database/attributes';
import { AuthProvider } from '../../../database/enums';
import { Role } from '../../../database/models/role.model';
import { UserRole } from '../../../database/models/user-role.model';
import { User } from '../../../database/models/user.model';
import { FirebaseService } from '../../firebase/firebase.service';
import type { DbSeeder } from '../../seed/types/db-seeder.interface';

const MIN_PASSWORD_LENGTH = 8;

@Injectable()
export class SuperAdminSeeder implements DbSeeder {
  readonly name = 'super-admin';
  readonly description = 'Firebase + DB super admin (dev/staging)';

  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(UserRole) private readonly userRoleModel: typeof UserRole,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService,
  ) {}

  async run(): Promise<void> {
    const email = this.requireEnv('SUPER_ADMIN_EMAIL').toLowerCase();
    const password = this.requireEnv('SUPER_ADMIN_PASSWORD');
    const name = this.configService.get<string>('SUPER_ADMIN_NAME')?.trim() || 'Super Admin';

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`SUPER_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const firebaseUid = await this.firebaseService.upsertPasswordUser({
      email,
      password,
      displayName: name,
    });
    await this.ensureDbSuperAdmin({ email, name, firebaseUid });

    this.logger.log(
      `Super admin ready: ${email} (Firebase uid: ${firebaseUid}, primary role: ${SUPER_ADMIN_ROLE_KEY})`,
    );
  }

  private requireEnv(name: string): string {
    const value = this.configService.get<string>(name)?.trim();
    if (!value) {
      throw new Error(`Missing required env var: ${name}`);
    }
    return value;
  }

  private async ensureDbSuperAdmin(params: { email: string; name: string; firebaseUid: string }): Promise<void> {
    const adminRole = await this.roleModel.findByPk(SUPER_ADMIN_ROLE_KEY, {
      attributes: [...ROLE_KEY_ATTRS],
    });
    if (!adminRole) {
      throw new Error(
        `Super admin role (${SUPER_ADMIN_ROLE_KEY}) not found — run migrations first (pnpm db:migrate or pnpm db:seed)`,
      );
    }

    const now = new Date();
    const sequelize = this.userModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance unavailable');
    }

    await sequelize.transaction(async (transaction) => {
      const [user] = await this.userModel.findOrCreate({
        where: { email: params.email },
        defaults: {
          name: params.name,
          email: params.email,
          firebaseUid: params.firebaseUid,
          authProvider: AuthProvider.PASSWORD,
          emailVerifiedAt: now,
          primaryRoleKey: adminRole.key,
          orgId: null,
        },
        transaction,
      });

      await user.update(
        {
          name: params.name,
          firebaseUid: params.firebaseUid,
          authProvider: AuthProvider.PASSWORD,
          emailVerifiedAt: now,
          primaryRoleKey: adminRole.key,
          orgId: null,
          deletedAt: null,
        },
        { transaction },
      );

      await this.userRoleModel.findOrCreate({
        where: { userId: user.id, roleKey: adminRole.key },
        defaults: { userId: user.id, roleKey: adminRole.key },
        transaction,
      });
    });
  }
}
