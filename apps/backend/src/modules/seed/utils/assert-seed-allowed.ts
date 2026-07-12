export function assertSeedAllowed(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('db:seed is not allowed when NODE_ENV=production');
  }
}
