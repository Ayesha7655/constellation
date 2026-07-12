import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { AppLocale } from '../../common/i18n/types';
import { resolveLocalized } from '../../common/i18n/resolve-localized';
import {
  PERMISSION_CATALOG_ATTRS,
  PERMISSION_CATEGORY_LABEL_ATTRS,
  ROLE_ADMIN_LIST_ATTRS,
  ROLE_PERMISSION_JOIN_ATTRS,
} from '../../database/attributes';
import { Permission } from '../../database/models/permission.model';
import { Role } from '../../database/models/role.model';
import { RolePermission } from '../../database/models/role-permission.model';
import type { RoleSummaryDto } from './dto/role-summary.dto';

@Injectable()
export class AdminRolesService {
  constructor(@InjectModel(Role) private readonly roleModel: typeof Role) {}

  async listRoles(locale: AppLocale): Promise<RoleSummaryDto[]> {
    const roles = await this.roleModel.findAll({
      attributes: [...ROLE_ADMIN_LIST_ATTRS],
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: RolePermission,
          as: 'rolePermissions',
          attributes: [...ROLE_PERMISSION_JOIN_ATTRS],
          include: [
            {
              model: Permission,
              as: 'permission',
              attributes: [...PERMISSION_CATALOG_ATTRS],
              include: [{ association: 'categoryRef', attributes: [...PERMISSION_CATEGORY_LABEL_ATTRS] }],
            },
          ],
        },
      ],
    });

    return roles.map((role) => {
      const permissions = [...role.rolePermissions]
        .sort((left, right) => left.permission.sortOrder - right.permission.sortOrder)
        .map((entry) => {
          const description = entry.permission.description
            ? resolveLocalized(entry.permission.description, locale)
            : undefined;
          return {
            key: entry.permission.key,
            name: resolveLocalized(entry.permission.name, locale),
            category: entry.permission.category,
            categoryLabel: resolveLocalized(entry.permission.categoryRef.label, locale),
            ...(description ? { description } : {}),
          };
        });

      return {
        key: role.key,
        displayName: resolveLocalized(role.displayName, locale),
        permissionCount: permissions.length,
        permissions,
      };
    });
  }
}
