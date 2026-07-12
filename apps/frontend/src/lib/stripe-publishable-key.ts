/** Public config API first, then NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for local/dev fallback. */
export function resolveStripePublishableKey(apiKey: string | null | undefined): string | null {
  const fromApi = apiKey?.trim();
  if (fromApi) {
    return fromApi;
  }

  const fromEnv = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return fromEnv || null;
}
