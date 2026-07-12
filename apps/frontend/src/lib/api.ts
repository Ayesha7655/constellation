import type { ApiHealthResponse } from '@/types/api';
import { getServerApiLocale } from '@/lib/api-locale';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4050/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const locale = await getServerApiLocale();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-locale': locale,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || response.statusText, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<ApiHealthResponse>('/health'),
};
