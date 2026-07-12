import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../database/permissions.service';
import { INSUFFICIENT_PERMISSIONS_MESSAGE } from './permissions.constants';
import { REQUIRE_ANY_PERMISSIONS_KEY } from './require-any-permissions.decorator';
import { REQUIRE_PERMISSIONS_KEY } from './require-permissions.decorator';
import type { AuthenticatedRequest } from '../types/request.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAll = this.reflector.getAllAndOverride<string[] | undefined>(REQUIRE_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredAny = this.reflector.getAllAndOverride<string[] | undefined>(REQUIRE_ANY_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.sub;

    if (!userId) {
      if (requiredAll?.length || requiredAny?.length) {
        throw new ForbiddenException(INSUFFICIENT_PERMISSIONS_MESSAGE);
      }
      return true;
    }

    const roleKey = request.user?.role;
    const granted = roleKey
      ? await this.permissionsService.getPermissionKeysForRole(roleKey)
      : await this.permissionsService.getPrimaryRolePermissionKeys(userId);

    if (!requiredAll?.length && !requiredAny?.length) {
      return true;
    }

    if (requiredAll?.length) {
      const hasAll = requiredAll.every((key) => granted.has(key));
      if (!hasAll) {
        throw new ForbiddenException(INSUFFICIENT_PERMISSIONS_MESSAGE);
      }
    }

    if (requiredAny?.length) {
      const hasAny = requiredAny.some((key) => granted.has(key));
      if (!hasAny) {
        throw new ForbiddenException(INSUFFICIENT_PERMISSIONS_MESSAGE);
      }
    }

    return true;
  }
}
