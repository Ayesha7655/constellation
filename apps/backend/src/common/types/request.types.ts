import type { Request } from 'express';
import type { AppLocale } from '../i18n/types';

export type JwtPayload = Readonly<{
  sub: string;
  sid?: string;
  role?: string;
  email?: string;
  tokenType?: string;
  jti?: string;
  exp?: number;
}>;

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

export type LocaleAwareRequest = AuthenticatedRequest & {
  locale: AppLocale;
};
