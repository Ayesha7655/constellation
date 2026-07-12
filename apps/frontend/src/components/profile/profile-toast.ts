import { showUserToast, type TranslateFn } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';

export function showProfileSuccess(message: string): void {
  showUserToast(message, undefined, 'profile', 'success');
}

export function showProfileError(error: unknown, tErrors: TranslateFn): void {
  showUserToast(translateAuthRequestError(error, tErrors), error, 'profile', 'error');
}

export function showProfileErrorMessage(message: string): void {
  showUserToast(message, undefined, 'profile', 'error');
}
