import { getServerApiLocale } from '@/lib/api-locale';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4050/api';

export async function serverApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const locale = await getServerApiLocale();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-locale': locale,
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}): ${path}`);
  }

  return response.json() as Promise<T>;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';
}
