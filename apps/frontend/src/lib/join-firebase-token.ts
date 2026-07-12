import { getFirebaseAuth } from '@/services/firebase';

/** Returns a fresh Firebase ID token for join submit (force-refresh before API call). */
export async function getFreshJoinFirebaseIdToken(): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    return null;
  }
  return user.getIdToken(true);
}
