import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { SUPER_ADMIN_ROLE_KEY, API_ERROR_CODES } from '@constellation/shared';
import type { AppLocale } from '../../common/i18n/types';
import { resolveLocalized } from '../../common/i18n/resolve-localized';
import { codedBadRequest, codedConflict, codedNotFound } from '../../common/exceptions/coded-http.exception';
import { PaginationService } from '../../common/services/pagination.service';
import { buildUserTextSearchWhere, normalizeListSearchTerm } from '../../common/search/list-text-search';
import {
  ORG_PROFILE_ATTRS,
  ORG_SUMMARY_ATTRS,
  ROLE_FILTER_ATTRS,
  ROLE_PROFILE_ATTRS,
  USER_ADMIN_LIST_ATTRS,
  USER_ROLE_MEMBERSHIP_ATTRS,
} from '../../database/attributes';
import { UserStatus } from '../../database/enums';
import { Organization } from '../../database/models/organization.model';
import { Role } from '../../database/models/role.model';
import { UserRole } from '../../database/models/user-role.model';
import { User } from '../../database/models/user.model';
import { FirebaseService } from '../firebase/firebase.service';
import { SessionService } from '../session/session.service';
import type { UserManageableStatus } from './dto/update-user-status.dto';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(UserRole) private readonly userRoleModel: typeof UserRole,
    @InjectModel(Role) private readonly roleModel: typeof Role,
    private readonly paginationService: PaginationService,
    private readonly sessionService: SessionService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async listFilterRoles(locale: AppLocale) {
    const rows = await this.roleModel.findAll({
      order: [['key', 'ASC']],
      attributes: [...ROLE_FILTER_ATTRS],
    });
    return {
      roles: rows.map((row) => ({
        key: row.key,
        label: resolveLocalized(row.displayName, locale),
      })),
    };
  }

  async listUsers(params: {
    locale: AppLocale;
    page?: number;
    limit?: number;
    q?: string;
    roleKey?: string;
    status?: UserManageableStatus;
  }) {
    const { page, limit, skip, take } = this.paginationService.resolve({
      page: params.page,
      limit: params.limit,
    });

    const where = this.buildListWhere(params);

    const { count: total, rows } = await this.userModel.findAndCountAll({
      where,
      attributes: [...USER_ADMIN_LIST_ATTRS],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: take,
      distinct: true,
      include: [
        { model: Role, as: 'primaryRole', attributes: [...ROLE_PROFILE_ATTRS] },
        {
          model: UserRole,
          as: 'userRoles',
          attributes: [...USER_ROLE_MEMBERSHIP_ATTRS],
          ...(params.roleKey ? { where: { roleKey: params.roleKey }, required: true } : {}),
          include: [{ model: Role, as: 'role', attributes: [...ROLE_PROFILE_ATTRS] }],
        },
        {
          model: Organization,
          as: 'organization',
          attributes: [...ORG_SUMMARY_ATTRS],
          required: false,
        },
      ],
    });

    const users = rows.map((row) => this.toUserSummary(row, params.locale));

    return {
      users,
      meta: this.paginationService.buildMeta(page, limit, total),
    };
  }

  async getUser(id: string, locale: AppLocale) {
    const user = await this.findUserDetailRow(id);
    if (!user) {
      codedNotFound(API_ERROR_CODES.USER_NOT_FOUND);
    }
    return this.toUserDetail(user, locale);
  }

  async updateUserStatus(id: string, status: UserManageableStatus, locale: AppLocale, actorUserId: string) {
    const user = await this.findUserDetailRow(id);
    if (!user) {
      codedNotFound(API_ERROR_CODES.USER_NOT_FOUND);
    }
    if (user.status === UserStatus.DELETED) {
      codedBadRequest(API_ERROR_CODES.USER_DELETED_CANNOT_UPDATE);
    }

    if (status === UserStatus.DEACTIVATED) {
      await this.assertCanDeactivateUser(id, actorUserId);
    }

    if (user.status === status) {
      return this.toUserDetail(user, locale);
    }

    await this.userModel.update({ status }, { where: { id } });

    if (status === UserStatus.DEACTIVATED) {
      await this.sessionService.revokeAllUserSessions({ userId: id });
      if (user.firebaseUid) {
        try {
          await this.firebaseService.revokeRefreshTokens(user.firebaseUid);
        } catch (error) {
          this.logger.warn(`Failed to revoke Firebase tokens for deactivated user ${id}`, error);
        }
      }
    }

    const updated = await this.findUserDetailRow(id);
    if (!updated) {
      codedNotFound(API_ERROR_CODES.USER_NOT_FOUND);
    }
    return this.toUserDetail(updated, locale);
  }

  private async assertCanDeactivateUser(targetUserId: string, actorUserId: string): Promise<void> {
    if (targetUserId === actorUserId) {
      codedBadRequest(API_ERROR_CODES.USER_CANNOT_DEACTIVATE_SELF);
    }

    const targetHasSuperAdminRole = await this.userRoleModel.findOne({
      where: { userId: targetUserId, roleKey: SUPER_ADMIN_ROLE_KEY },
      attributes: [...USER_ROLE_MEMBERSHIP_ATTRS],
    });
    if (!targetHasSuperAdminRole) {
      return;
    }

    const otherActiveSuperAdmins = await this.userModel.count({
      where: {
        deletedAt: null,
        status: UserStatus.ACTIVE,
        id: { [Op.ne]: targetUserId },
      },
      include: [
        {
          model: UserRole,
          as: 'userRoles',
          where: { roleKey: SUPER_ADMIN_ROLE_KEY },
          required: true,
          attributes: [...USER_ROLE_MEMBERSHIP_ATTRS],
        },
      ],
    });
    if (otherActiveSuperAdmins === 0) {
      codedConflict(API_ERROR_CODES.USER_LAST_ACTIVE_ADMIN);
    }
  }

  private buildListWhere(params: { status?: UserManageableStatus; q?: string }) {
    const and: Record<string, unknown>[] = [{ deletedAt: null }];

    if (params.status) {
      and.push({ status: params.status });
    }

    const searchTerm = normalizeListSearchTerm(params.q);
    if (searchTerm) {
      and.push(buildUserTextSearchWhere(searchTerm));
    }

    return { [Op.and]: and };
  }

  private findUserDetailRow(id: string) {
    return this.userModel.findOne({
      where: { id, deletedAt: null },
      attributes: [...USER_ADMIN_LIST_ATTRS],
      include: [
        { model: Role, as: 'primaryRole', attributes: [...ROLE_PROFILE_ATTRS] },
        {
          model: UserRole,
          as: 'userRoles',
          attributes: [...USER_ROLE_MEMBERSHIP_ATTRS],
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
  }

  private toUserSummary(row: User, locale: AppLocale) {
    const roles = row.userRoles.map((entry) => ({
      key: entry.role.key,
      label: resolveLocalized(entry.role.displayName, locale),
    }));

    const primaryRole = {
      key: row.primaryRole.key,
      label: resolveLocalized(row.primaryRole.displayName, locale),
    };

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      primaryRole,
      roles,
      orgId: row.orgId,
      orgName: row.organization?.name ?? null,
      createdAt: row.createdAt.toISOString(),
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    };
  }

  private toUserDetail(row: User, locale: AppLocale) {
    const summary = this.toUserSummary(row, locale);
    return {
      ...summary,
      orgAddress: row.organization?.address ?? null,
    };
  }
}
