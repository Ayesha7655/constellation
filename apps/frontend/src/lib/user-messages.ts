import { API_ERROR_CODES } from '@constellation/shared';
import {
  logTechnicalError,
  lookupHttpStatusKey,
  lookupMessageKey,
  showUserToast,
  translateUserMessage,
  type TranslateFn,
} from '@/i18n/translate-user-message';
import { translateAuthCode } from '@/lib/translate-auth-code';

export class AuthRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly rawMessage: string,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(rawMessage);
    this.name = 'AuthRequestError';
  }
}

/** True when `error` is an AuthRequestError carrying the given backend code. */
export function isApiCode(error: unknown, code: string): boolean {
  return error instanceof AuthRequestError && error.code === code;
}

export function translateAuthRequestError(error: unknown, t: TranslateFn): string {
  if (error instanceof AuthRequestError) {
    if (error.code) {
      return translateAuthCode(error.code, t);
    }
    const messageKey = lookupMessageKey(error.rawMessage);
    if (messageKey) {
      return t(messageKey);
    }
    const statusKey = lookupHttpStatusKey(error.status);
    if (statusKey) {
      return t(statusKey);
    }
    return translateUserMessage(error.rawMessage, t);
  }

  if (error instanceof Error) {
    return translateUserMessage(error.message, t);
  }

  return t('errors.generic');
}

export function isCountryRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.countryKeyPreviouslyDeleted';
}

export function isCityRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.cityKeyPreviouslyDeleted';
}

export function isManufacturerRestoreRequired(error: unknown): boolean {
  return isApiCode(error, API_ERROR_CODES.MANUFACTURER_KEY_PREVIOUSLY_DELETED);
}

export function isModelRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.modelKeyPreviouslyDeleted';
}

export function isModelSpecFieldRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.modelSpecFieldKeyPreviouslyDeleted';
}

export function isUseCaseRestoreRequired(error: unknown): boolean {
  return isApiCode(error, API_ERROR_CODES.USE_CASE_KEY_PREVIOUSLY_DELETED);
}

export function isSensorRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.sensorKeyPreviouslyDeleted';
}


export function isLogisticsProviderRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.logisticsProviderKeyPreviouslyDeleted';
}

export function isListingTypeRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.listingTypeKeyPreviouslyDeleted';
}

export function isUsedConditionRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.usedConditionKeyPreviouslyDeleted';
}

export function isShippingMethodRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.shippingMethodKeyPreviouslyDeleted';
}

export function isTrackingOptionRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.trackingOptionKeyPreviouslyDeleted';
}

export function isCargoInsuranceOptionRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.cargoInsuranceOptionKeyPreviouslyDeleted';
}

export function isCustomsDocumentOptionRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.customsDocumentOptionKeyPreviouslyDeleted';
}

export function isSecurePaymentStateRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.securePaymentStateKeyPreviouslyDeleted';
}

export function isCurrencyRestoreRequired(error: unknown): boolean {
  if (!(error instanceof AuthRequestError)) {
    return false;
  }
  return lookupMessageKey(error.rawMessage) === 'errors.api.currencyKeyPreviouslyDeleted';
}

export { logTechnicalError, showUserToast, translateAuthCode };
