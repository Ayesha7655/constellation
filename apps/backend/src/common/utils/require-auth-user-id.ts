import { UnauthorizedException } from '@nestjs/common';

export function requireAuthUserId(userId: string | undefined): string {
  if (!userId) {
    throw new UnauthorizedException();
  }
  return userId;
}
