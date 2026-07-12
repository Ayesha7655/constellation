import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  PERMISSION_CATALOG_ATTRS,
  PERMISSION_CATEGORY_LABEL_ATTRS,
  ROLE_PERMISSION_KEY_ATTRS,
  USER_PRIMARY_ROLE_KEY_ATTRS,
} from './attributes';
import { Permission } from './models/permission.model';
import { RolePermission } from './models/role-permission.model';
import { User } from './models/user.model';

export type CachedPermissionMeta = Readonly<{
  key: string;
  name: unknown;
  description: unknown;
  category: string;
  categoryLabel: unknown;
  sortOrder: number;
}>;

export type PermissionCatalog = Readonly<Record<string, CachedPermissionMeta>>;

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(RolePermission) private readonly rolePermissionModel: typeof RolePermission,
    @InjectModel(Permission) private readonly permissionModel: typeof Permission,
  ) {}

  async getPrimaryRoleKeyForUser(userId: string): Promise<string | null> {
    const user = await this.userModel.findOne({
      where: { id: userId },
      attributes: [...USER_PRIMARY_ROLE_KEY_ATTRS],
    });
    return user?.primaryRoleKey ?? null;
  }

  async getPermissionKeysForRole(roleKey: string): Promise<ReadonlySet<string>> {
    const rows = await this.rolePermissionModel.findAll({
      where: { roleKey },
      attributes: [...ROLE_PERMISSION_KEY_ATTRS],
    });
    return new Set(rows.map((entry) => entry.permissionKey));
  }

  async getPermissionCatalog(): Promise<PermissionCatalog> {
    const rows = await this.permissionModel.findAll({
      attributes: [...PERMISSION_CATALOG_ATTRS],
      include: [{ association: 'categoryRef', attributes: [...PERMISSION_CATEGORY_LABEL_ATTRS] }],
    });

    const catalog: Record<string, CachedPermissionMeta> = {};
    for (const row of rows) {
      catalog[row.key] = {
        key: row.key,
        name: row.name,
        description: row.description,
        category: row.category,
        categoryLabel: row.categoryRef?.label,
        sortOrder: row.sortOrder,
      };
    }
    return catalog;
  }

  async getPrimaryRolePermissionKeys(userId: string): Promise<ReadonlySet<string>> {
    const roleKey = await this.getPrimaryRoleKeyForUser(userId);
    if (!roleKey) {
      return new Set();
    }
    return this.getPermissionKeysForRole(roleKey);
  }

  async setRolePermissions(roleKey: string, permissionKeys: readonly string[]): Promise<void> {
    const sequelize = this.rolePermissionModel.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance unavailable');
    }

    await sequelize.transaction(async (transaction) => {
      await this.rolePermissionModel.destroy({ where: { roleKey }, transaction });
      if (permissionKeys.length > 0) {
        await this.rolePermissionModel.bulkCreate(
          permissionKeys.map((permissionKey) => ({ roleKey, permissionKey })),
          { transaction },
        );
      }
    });
    this.logger.debug(`Updated permissions for role ${roleKey}`);
  }
}
