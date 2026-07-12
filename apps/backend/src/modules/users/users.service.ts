import { BadRequestException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { AppLocale } from '../../common/i18n/types';
import { resolveLocalized } from '../../common/i18n/resolve-localized';
import { resolveDashboardHomePath, isOrgProfileComplete } from '../../common/utils/dashboard-path';
import { requireAuthUserId } from '../../common/utils/require-auth-user-id';
import { ORG_PROFILE_ATTRS, ROLE_PROFILE_ATTRS, USER_ID_ATTRS, USER_PROFILE_ATTRS } from '../../database/attributes';
import { PermissionsService } from '../../database/permissions.service';
import { AuthProvider } from '../../database/enums';
import { Organization } from '../../database/models/organization.model';
import { Role } from '../../database/models/role.model';
import { UserRole } from '../../database/models/user-role.model';
import { User } from '../../database/models/user.model';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(UserRole) private readonly userRoleModel: typeof UserRole,
    @InjectModel(Organization) private readonly organizationModel: typeof Organization,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    private readonly permissionsService: PermissionsService,
  ) {}

  async createUserWithOrg(params: {
    name: string;
    email: string;
    firebaseUid: string;
    authProvider: AuthProvider;
    photoUrl: string | null;
    roleKey: string;
    emailVerifiedAt?: Date;
  }) {
    const role = await this.roleModel.findByPk(params.roleKey, {
      attributes: ['key'],
    });
    if (!role) {
      throw new BadRequestException(`Role ${params.roleKey} not found`);
    }

    const sequelize = this.userModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance unavailable');
    }

    return sequelize.transaction(async (transaction) => {
      const organization = await this.organizationModel.create({ name: null, address: null }, { transaction });

      const user = await this.userModel.create(
        {
          name: params.name,
          email: params.email,
          firebaseUid: params.firebaseUid,
          authProvider: params.authProvider,
          photoUrl: params.photoUrl,
          emailVerifiedAt: params.emailVerifiedAt ?? null,
          primaryRoleKey: params.roleKey,
          orgId: organization.id,
        },
        { transaction },
      );

      await this.userRoleModel.create({ userId: user.id, roleKey: params.roleKey }, { transaction });

      await user.reload({
        include: [{ model: Role, as: 'primaryRole', attributes: ['key'] }],
        transaction,
      });

      return user;
    });
  }

  async getCurrentUserProfileForRequest(
    userId: string | undefined,
    locale: AppLocale,
    activeRoleKey: string | undefined,
  ) {
    return this.getCurrentUserProfile(requireAuthUserId(userId), locale, activeRoleKey);
  }

  async updateProfile(
    userId: string | undefined,
    dto: UpdateUserProfileDto,
    locale: AppLocale,
    activeRoleKeyFromJwt?: string,
  ) {
    const id = requireAuthUserId(userId);
    try {
      const existing = await this.userModel.findOne({
        where: { id, deletedAt: null },
        attributes: [...USER_ID_ATTRS],
      });
      if (!existing) {
        throw new NotFoundException('User not found');
      }

      if (dto.name === undefined) {
        throw new BadRequestException('No profile fields to update');
      }

      const [updatedCount] = await this.userModel.update({ name: dto.name }, { where: { id, deletedAt: null } });
      if (updatedCount === 0) {
        throw new NotFoundException('User not found');
      }

      return await this.getCurrentUserProfile(id, locale, activeRoleKeyFromJwt);
    } catch (error) {
      const level = error instanceof HttpException && error.getStatus() < 500 ? 'warn' : 'error';
      this.logger[level](`[UsersService.updateProfile] userId=${id}: ${(error as Error).message}`);
      throw error;
    }
  }

  async getCurrentUserProfile(userId: string, locale: AppLocale, activeRoleKeyFromJwt?: string) {
    const user = await this.userModel.findOne({
      where: {
        id: userId,
        deletedAt: null,
      },
      attributes: [...USER_PROFILE_ATTRS],
      include: [
        {
          model: Role,
          as: 'primaryRole',
          attributes: [...ROLE_PROFILE_ATTRS],
        },
        {
          model: UserRole,
          as: 'userRoles',
          attributes: ['roleKey'],
          include: [{ model: Role, as: 'role', attributes: [...ROLE_PROFILE_ATTRS] }],
        },
        {
          model: Organization,
          as: 'organization',
          attributes: [...ORG_PROFILE_ATTRS],
          required: false,
        },
      ],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const membershipKeys = new Set(user.userRoles.map((entry) => entry.role.key));
    let activeRoleKey = activeRoleKeyFromJwt?.trim() ?? '';
    if (!activeRoleKey || !membershipKeys.has(activeRoleKey)) {
      activeRoleKey = user.primaryRole.key;
    }

    const activeRoleEntry = user.userRoles.find((entry) => entry.role.key === activeRoleKey)?.role ?? user.primaryRole;

    const roleMemberships = user.userRoles.map((entry) => ({
      key: entry.role.key,
      label: resolveLocalized(entry.role.displayName, locale),
      dashboardHomePath: resolveDashboardHomePath(entry.role.key),
    }));

    const [permissionKeys, catalog] = await Promise.all([
      this.permissionsService.getPermissionKeysForRole(activeRoleEntry.key),
      this.permissionsService.getPermissionCatalog(),
    ]);

    const permissions = [...permissionKeys]
      .map((key) => catalog[key])
      .filter((meta): meta is NonNullable<typeof meta> => Boolean(meta))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((meta) => {
        const description = meta.description ? resolveLocalized(meta.description, locale) : undefined;
        return {
          key: meta.key,
          name: resolveLocalized(meta.name, locale),
          category: meta.category,
          categoryLabel: resolveLocalized(meta.categoryLabel, locale),
          ...(description ? { description } : {}),
        };
      });

    const org = user.organization;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      status: user.status,
      authProvider: user.authProvider,
      orgId: user.orgId,
      orgName: org?.name ?? null,
      orgAddress: org?.address ?? null,
      orgProfileComplete: isOrgProfileComplete(org),
      role: resolveLocalized(activeRoleEntry.displayName, locale),
      roleCode: activeRoleEntry.key,
      activeRoleKey: activeRoleEntry.key,
      primaryRoleCode: user.primaryRole.key,
      dashboardHomePath: resolveDashboardHomePath(activeRoleEntry.key),
      roles: user.userRoles.map((entry) => resolveLocalized(entry.role.displayName, locale)),
      roleMemberships,
      permissions,
    };
  }
}
