import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Req } from '@nestjs/common';
import { ADMIN, API_ERROR_CODES } from '@constellation/shared';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { requireAuthUserId } from '../../common/utils/require-auth-user-id';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiProtectedAdminRoute } from '../../swagger/api-routes';
import { AdminRolesService } from './admin-roles.service';
import { AdminUsersService } from './admin-users.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { RolesListResponseDto } from './dto/roles-list-response.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserDetailDto, UsersListResponseDto } from './dto/user-summary.dto';
import { UserFilterRolesResponseDto } from './dto/user-filter-roles-response.dto';

@ApiLocaleBearerController('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminRolesService: AdminRolesService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  @Get('ping')
  @RequirePermissions(ADMIN.PLATFORM_MANAGE)
  @ApiProtectedAdminRoute({
    summary: 'Admin access check',
    ok: { schema: { example: { ok: true } } },
  })
  ping() {
    return { ok: true };
  }

  @Get('roles')
  @RequirePermissions(ADMIN.ROLES_READ)
  @ApiProtectedAdminRoute({
    summary: 'List all roles with resolved permissions',
    ok: { type: RolesListResponseDto },
  })
  async listRoles(@Req() request: LocaleAwareRequest): Promise<RolesListResponseDto> {
    const roles = await this.adminRolesService.listRoles(request.locale);
    return { roles };
  }

  @Get('users/roles')
  @RequirePermissions(ADMIN.USERS_READ)
  @ApiProtectedAdminRoute({
    summary: 'List roles for admin users list filters',
    ok: { type: UserFilterRolesResponseDto },
  })
  async listUserFilterRoles(@Req() request: LocaleAwareRequest): Promise<UserFilterRolesResponseDto> {
    return this.adminUsersService.listFilterRoles(request.locale);
  }

  @Get('users')
  @RequirePermissions(ADMIN.USERS_READ)
  @ApiProtectedAdminRoute({
    summary: 'List all platform users',
    ok: { type: UsersListResponseDto },
    validation: true,
  })
  async listUsers(
    @Req() request: LocaleAwareRequest,
    @Query() query: ListUsersQueryDto,
  ): Promise<UsersListResponseDto> {
    const result = await this.adminUsersService.listUsers({
      locale: request.locale,
      page: query.page,
      limit: query.limit,
      status: query.status,
      roleKey: query.roleKey,
      q: query.q,
    });
    return { users: result.users, meta: result.meta };
  }

  @Get('users/:id')
  @RequirePermissions(ADMIN.USERS_READ)
  @ApiProtectedAdminRoute({
    summary: 'Get platform user details',
    ok: { type: UserDetailDto },
    notFound: { codes: [API_ERROR_CODES.USER_NOT_FOUND] },
  })
  async getUser(@Req() request: LocaleAwareRequest, @Param('id', ParseUUIDPipe) id: string): Promise<UserDetailDto> {
    return this.adminUsersService.getUser(id, request.locale);
  }

  @Patch('users/:id/status')
  @RequirePermissions(ADMIN.USERS_UPDATE)
  @ApiProtectedAdminRoute({
    summary: 'Activate or deactivate a platform user',
    ok: { type: UserDetailDto },
    validation: true,
    notFound: { codes: [API_ERROR_CODES.USER_NOT_FOUND] },
    badRequest: {
      codes: [API_ERROR_CODES.USER_DELETED_CANNOT_UPDATE, API_ERROR_CODES.USER_CANNOT_DEACTIVATE_SELF],
    },
    conflict: { codes: [API_ERROR_CODES.USER_LAST_ACTIVE_ADMIN] },
  })
  async updateUserStatus(
    @Req() request: LocaleAwareRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserStatusDto,
  ): Promise<UserDetailDto> {
    return this.adminUsersService.updateUserStatus(
      id,
      body.status,
      request.locale,
      requireAuthUserId(request.user?.sub),
    );
  }
}
