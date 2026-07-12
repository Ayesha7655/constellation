function getExpiresInSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    return 3600;
  }
  const raw = Number(match[1]);
  const unit = match[2];
  if (unit === 's') return raw;
  if (unit === 'm') return raw * 60;
  if (unit === 'h') return raw * 60 * 60;
  return raw * 60 * 60 * 24;
}

export function parseExpiresInSeconds(expiresIn: string): number {
  return getExpiresInSeconds(expiresIn);
}
