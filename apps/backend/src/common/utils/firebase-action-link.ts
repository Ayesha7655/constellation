export type AppAuthActionPath = 'reset-password' | 'verify-email';

export function buildAppActionLink(
  firebaseLink: string,
  webUrl: string,
  path: AppAuthActionPath,
  options?: Readonly<{ email?: string }>,
): string {
  const parsed = new URL(firebaseLink);
  const oobCode = parsed.searchParams.get('oobCode');
  if (!oobCode) {
    throw new Error('Firebase action link is missing oobCode');
  }

  const base = webUrl.replace(/\/$/, '');
  const appUrl = new URL(`${base}/${path}`);
  appUrl.searchParams.set('oobCode', oobCode);
  if (path === 'verify-email' && options?.email) {
    appUrl.searchParams.set('email', options.email);
  }
  return appUrl.toString();
}

export function getWebActionCodeSettings(
  webUrl: string,
  path: AppAuthActionPath,
): {
  url: string;
  handleCodeInApp: boolean;
} {
  const base = webUrl.replace(/\/$/, '');
  return {
    url: `${base}/${path}`,
    handleCodeInApp: true,
  };
}
