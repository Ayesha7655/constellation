import toast from 'react-hot-toast';
import { isBackendMessageCode, translateAuthCode } from '@/lib/translate-auth-code';

/**
 * Maps raw API / validation English messages to next-intl error keys under `errors.*`.
 */

function normalizeKey(message: string): string {
  return message.trim().toLowerCase();
}

const API_MESSAGE_KEY_MAP: Record<string, string> = {
  'invalid firebase token': 'errors.api.invalidFirebaseToken',
  'verify your email before signing in': 'errors.api.verifyEmailBeforeSignIn',
  'please verify your email, then sign in.': 'errors.api.verifyEmailBeforeSignIn',
  'firebase account has no email': 'errors.api.firebaseAccountNoEmail',
  'email already registered': 'errors.api.emailAlreadyRegistered',
  'account suspended': 'errors.api.accountSuspended',
  'invalid refresh token': 'errors.api.invalidRefreshToken',
  'invalid token': 'errors.api.invalidToken',
  'token revoked': 'errors.api.tokenRevoked',
  'account not active': 'errors.api.accountNotActive',
  'user account is not authorized': 'errors.api.userNotAuthorized',
  'bad request': 'errors.api.badRequest',
  unauthorized: 'errors.api.unauthorized',
  forbidden: 'errors.api.forbidden',
  'too many attempts. try again in a few minutes.': 'errors.api.tooManyAttempts',
  'sign-in could not be verified. please try again.': 'errors.api.idTokenInvalid',
  'account role is not configured. please contact support.': 'errors.api.accountRoleNotConfigured',
  'invalid token type': 'errors.api.invalidTokenType',
  'country key already exists': 'errors.api.countryKeyExists',
  'country key was previously deleted': 'errors.api.countryKeyPreviouslyDeleted',
  'city key already exists': 'errors.api.cityKeyExists',
  'city key was previously deleted': 'errors.api.cityKeyPreviouslyDeleted',
  // 'manufacturer key already exists' / '… was previously deleted' migrated to coded errors (api.manufacturer.*) — DEV-32062 A.6.
  'model key already exists': 'errors.api.modelKeyExists',
  'model key was previously deleted': 'errors.api.modelKeyPreviouslyDeleted',
  'model spec field key already exists': 'errors.api.modelSpecFieldKeyExists',
  'model spec field key was previously deleted': 'errors.api.modelSpecFieldKeyPreviouslyDeleted',
  'model spec field not found': 'errors.api.modelSpecFieldNotFound',
  'model spec field value type change blocked by existing model values':
    'errors.api.modelSpecFieldValueTypeChangeBlocked',
  'manufacturer not found': 'errors.api.manufacturerNotFound',
  'model not found': 'errors.api.modelNotFound',
  'use case not found': 'errors.api.useCaseNotFound',
  'sensor not found': 'errors.api.sensorNotFound',
  'use case key already exists': 'errors.api.useCaseKeyExists',
  'use case key was previously deleted': 'errors.api.useCaseKeyPreviouslyDeleted',
  'sensor key already exists': 'errors.api.sensorKeyExists',
  'sensor key was previously deleted': 'errors.api.sensorKeyPreviouslyDeleted',
  'logistics provider not found': 'errors.api.logisticsProviderNotFound',
  'logistics provider key already exists': 'errors.api.logisticsProviderKeyExists',
  'logistics provider key was previously deleted': 'errors.api.logisticsProviderKeyPreviouslyDeleted',
  'listing type not found': 'errors.api.listingTypeNotFound',
  'certified stock listings are not available yet': 'errors.api.certifiedStockNotAvailableYet',
  'listing type key already exists': 'errors.api.listingTypeKeyExists',
  'listing type key was previously deleted': 'errors.api.listingTypeKeyPreviouslyDeleted',
  'used condition not found': 'errors.api.usedConditionNotFound',
  'used condition key already exists': 'errors.api.usedConditionKeyExists',
  'used condition key was previously deleted': 'errors.api.usedConditionKeyPreviouslyDeleted',
  'shipping method not found': 'errors.api.shippingMethodNotFound',
  'shipping method key already exists': 'errors.api.shippingMethodKeyExists',
  'shipping method key was previously deleted': 'errors.api.shippingMethodKeyPreviouslyDeleted',
  'tracking option not found': 'errors.api.trackingOptionNotFound',
  'tracking option key already exists': 'errors.api.trackingOptionKeyExists',
  'tracking option key was previously deleted': 'errors.api.trackingOptionKeyPreviouslyDeleted',
  'cargo insurance option not found': 'errors.api.cargoInsuranceOptionNotFound',
  'cargo insurance option key already exists': 'errors.api.cargoInsuranceOptionKeyExists',
  'cargo insurance option key was previously deleted': 'errors.api.cargoInsuranceOptionKeyPreviouslyDeleted',
  'customs document option not found': 'errors.api.customsDocumentOptionNotFound',
  'customs document option key already exists': 'errors.api.customsDocumentOptionKeyExists',
  'customs document option key was previously deleted': 'errors.api.customsDocumentOptionKeyPreviouslyDeleted',
  'secure payment state not found': 'errors.api.securePaymentStateNotFound',
  'secure payment state key already exists': 'errors.api.securePaymentStateKeyExists',
  'secure payment state key was previously deleted': 'errors.api.securePaymentStateKeyPreviouslyDeleted',
  'currency not found': 'errors.api.currencyNotFound',
  'currency key already exists': 'errors.api.currencyKeyExists',
  'currency key was previously deleted': 'errors.api.currencyKeyPreviouslyDeleted',
  'this reset link is invalid or has expired.': 'errors.api.invalidResetLink',
  'this verification link is invalid or has expired.': 'errors.api.invalidVerificationLink',
};

const VALIDATION_MESSAGE_KEY_MAP: Record<string, string> = {
  'idtoken must be longer than or equal to 10 characters': 'errors.api.idTokenInvalid',
  'idtoken must be a string': 'errors.api.idTokenInvalid',
  'idtoken should not be empty': 'errors.api.idTokenInvalid',
  'email must be an email': 'validation.invalidEmail',
  'invalid email': 'validation.invalidEmail',
  'password must be longer than or equal to 6 characters': 'validation.passwordMin',
  'min 6 characters': 'validation.passwordMin',
  'too long': 'validation.passwordTooLong',
};

const BACKEND_MESSAGE_KEY_MAP: Record<string, string> = {};

const FIREBASE_CODE_KEY_MAP: Record<string, string> = {
  'auth/email-already-in-use': 'errors.firebase.emailAlreadyInUse',
  'auth/invalid-credential': 'errors.firebase.invalidCredential',
  'auth/wrong-password': 'errors.firebase.invalidCredential',
  'auth/user-not-found': 'errors.firebase.invalidCredential',
  'auth/too-many-requests': 'errors.firebase.tooManyRequests',
  'auth/popup-closed-by-user': 'errors.firebase.popupClosed',
  'auth/invalid-api-key': 'errors.firebase.invalidApiKey',
  'auth/network-request-failed': 'errors.firebase.networkFailed',
  'auth/invalid-email': 'errors.firebase.invalidEmail',
  'auth/weak-password': 'errors.firebase.weakPassword',
};

const HTTP_STATUS_KEY_MAP: Record<number, string> = {
  400: 'errors.api.badRequest',
  401: 'errors.api.unauthorized',
  403: 'errors.api.forbidden',
  409: 'errors.api.emailAlreadyRegistered',
  429: 'errors.api.tooManyAttempts',
};

const TECHNICAL_PATTERN =
  /^(Error|TypeError|SyntaxError|FirebaseError):|prisma|nestjs|exception|stack trace|ECONNREFUSED|ENOTFOUND|internal server error|\bat\s+\w+\./i;

export type TranslateFn = (key: string) => string;

export function extractFirebaseAuthCode(message: string): string | undefined {
  const match = message.match(/auth\/[a-z0-9-]+/i);
  return match?.[0];
}

function looksTechnical(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (trimmed.length > 200) return true;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return true;
  if (TECHNICAL_PATTERN.test(trimmed)) return true;
  if (/^HTTP \d{3}$/i.test(trimmed)) return true;
  if (/^[a-z]+ must be /i.test(trimmed)) return true;
  if (/^[a-z]+ should not /i.test(trimmed)) return true;
  return false;
}

export function lookupMessageKey(raw: string | undefined): string | undefined {
  if (!raw?.trim()) {
    return undefined;
  }

  const key = normalizeKey(raw);
  if (API_MESSAGE_KEY_MAP[key]) {
    return API_MESSAGE_KEY_MAP[key];
  }
  if (BACKEND_MESSAGE_KEY_MAP[key]) {
    return BACKEND_MESSAGE_KEY_MAP[key];
  }
  if (VALIDATION_MESSAGE_KEY_MAP[key]) {
    return VALIDATION_MESSAGE_KEY_MAP[key];
  }
  if (key.includes('role') && key.includes('not found')) {
    return 'errors.api.signInUnavailable';
  }

  return undefined;
}

export function lookupFirebaseCodeKey(code: string | undefined): string | undefined {
  if (!code) {
    return undefined;
  }
  return FIREBASE_CODE_KEY_MAP[code];
}

export function lookupHttpStatusKey(status: number): string | undefined {
  if (status >= 500) {
    return 'errors.api.serverError';
  }
  return HTTP_STATUS_KEY_MAP[status];
}

export function translateUserMessage(
  raw: string | undefined,
  t: TranslateFn,
  fallbackKey = 'errors.generic',
): string {
  const trimmed = raw?.trim();
  if (trimmed && isBackendMessageCode(trimmed)) {
    return translateAuthCode(trimmed, t, fallbackKey);
  }

  const mappedKey = lookupMessageKey(raw);
  if (mappedKey) {
    return t(mappedKey);
  }

  if (!trimmed || looksTechnical(trimmed)) {
    return t(fallbackKey);
  }

  return trimmed;
}

export function translateFirebaseError(
  error: unknown,
  t: TranslateFn,
  fallbackKey: string,
): string {
  const objectCode =
    typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : undefined;

  if (objectCode && isBackendMessageCode(objectCode)) {
    return translateAuthCode(objectCode, t, fallbackKey);
  }

  const firebaseCode =
    objectCode && objectCode.startsWith('auth/')
      ? objectCode
      : error instanceof Error
        ? extractFirebaseAuthCode(error.message)
        : undefined;

  const firebaseKey = lookupFirebaseCodeKey(firebaseCode);
  if (firebaseKey) {
    return t(firebaseKey);
  }

  if (error instanceof Error) {
    return translateUserMessage(error.message, t, fallbackKey);
  }

  return t(fallbackKey);
}

export function translateBackendAckMessage(message: string, t: TranslateFn): string {
  return translateUserMessage(message, t, 'errors.generic');
}

export function logTechnicalError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}

export type UserToastVariant = 'success' | 'error';

export function showUserToast(
  userMessage: string,
  technical?: unknown,
  context = 'app',
  variant: UserToastVariant = 'success',
): void {
  if (technical !== undefined) {
    logTechnicalError(context, technical);
  }
  if (typeof window === 'undefined') {
    return;
  }
  if (variant === 'error') {
    toast.error(userMessage);
    return;
  }
  toast.success(userMessage);
}

export function showUserSuccessToast(userMessage: string): void {
  showUserToast(userMessage, undefined, 'app', 'success');
}

export function showUserErrorToast(
  userMessage: string,
  technical?: unknown,
  context = 'app',
): void {
  showUserToast(userMessage, technical, context, 'error');
}
