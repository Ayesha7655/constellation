import { showUserToast, type TranslateFn } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';

export function showAuthSuccess(message: string): void {
  showUserToast(message, undefined, 'auth', 'success');
}

export function showAuthError(error: unknown, tErrors: TranslateFn): void {
  showUserToast(translateAuthRequestError(error, tErrors), error, 'auth', 'error');
}

export function showAuthErrorMessage(message: string): void {
  showUserToast(message, undefined, 'auth', 'error');
}
