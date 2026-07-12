import { SessionPlatform } from '../../../database/enums';

export function getPlatformFromUserAgent(userAgent?: string): SessionPlatform {
  if (!userAgent) {
    return SessionPlatform.WEB;
  }
  if (userAgent.includes('Android')) {
    return SessionPlatform.ANDROID;
  }
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return SessionPlatform.IOS;
  }
  return SessionPlatform.WEB;
}
