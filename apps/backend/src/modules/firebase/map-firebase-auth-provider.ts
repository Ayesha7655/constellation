import { AuthProvider } from '../../database/enums';

export function mapFirebaseAuthProvider(signInProvider: string): AuthProvider {
  if (signInProvider === 'google.com') {
    return AuthProvider.GOOGLE;
  }
  if (signInProvider === 'apple.com') {
    return AuthProvider.APPLE;
  }
  return AuthProvider.PASSWORD;
}
