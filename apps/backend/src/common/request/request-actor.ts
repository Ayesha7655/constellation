import { UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/request.types';
import { requireAuthUserId } from '../utils/require-auth-user-id';

/** Authenticated user identity for the current HTTP request (JWT session active role). */
export type RequestActor = Readonly<{
  userId: string;
  activeRoleKey: string;
}>;

/** Policy/row-access viewers use `roleKey` — same value as `activeRoleKey`. */
export type RoleViewer = Readonly<{
  userId: string;
  roleKey: string;
}>;

export function resolveActiveRoleKey(roleFromJwt: string | undefined): string {
  const activeRoleKey = roleFromJwt?.trim();
  if (!activeRoleKey) {
    throw new UnauthorizedException('Invalid token');
  }
  return activeRoleKey;
}

export function resolveRequestActor(request: AuthenticatedRequest): RequestActor {
  return {
    userId: requireAuthUserId(request.user?.sub),
    activeRoleKey: resolveActiveRoleKey(request.user?.role),
  };
}

export function toRoleViewer(request: AuthenticatedRequest): RoleViewer {
  const actor = resolveRequestActor(request);
  return { userId: actor.userId, roleKey: actor.activeRoleKey };
}
