import { signOut } from 'firebase/auth';
import { clearAuthSession } from '@/lib/auth-session';
import { getFirebaseAuth } from '@/services/firebase';

export async function clearClientAuthSession(): Promise<void> {
  clearAuthSession();
  try {
    await signOut(getFirebaseAuth());
  } catch {
    /* Firebase may not be initialized or user already signed out */
  }
}

let invalidSessionRedirectPending = false;

/** Background polls (e.g. unread count) call this on 401 after the server rejects a still-present access token. */
export async function handleInvalidAuthSession(): Promise<void> {
  if (invalidSessionRedirectPending) {
    return;
  }
  invalidSessionRedirectPending = true;
  await clearClientAuthSession();
  window.location.assign('/sign-in');
}
