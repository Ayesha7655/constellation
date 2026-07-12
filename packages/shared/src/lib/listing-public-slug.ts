export const LISTING_PUBLIC_SLUG_NANOID_LENGTH = 10;

const NANOID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function generateListingSlugNanoid(length = LISTING_PUBLIC_SLUG_NANOID_LENGTH): string {
  const bytes = getRandomBytes(length);
  let id = '';
  for (let index = 0; index < length; index += 1) {
    const byte = bytes[index];
    if (byte === undefined) {
      break;
    }
    id += NANOID_ALPHABET[byte % NANOID_ALPHABET.length] ?? '0';
  }
  return id;
}

export function slugifyListingTitle(title: string | null | undefined): string {
  const normalized = (title ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return normalized.length > 0 ? normalized : 'robot-listing';
}

export function extractListingPublicSlugNanoidSuffix(slug: string): string | null {
  const separatorIndex = slug.lastIndexOf('-');
  if (separatorIndex <= 0) {
    return null;
  }
  const suffix = slug.slice(separatorIndex + 1);
  if (suffix.length !== LISTING_PUBLIC_SLUG_NANOID_LENGTH) {
    return null;
  }
  return suffix;
}

export function buildListingPublicSlug(title: string | null, existingSlug?: string | null): string {
  const base = slugifyListingTitle(title);
  if (existingSlug) {
    const suffix = extractListingPublicSlugNanoidSuffix(existingSlug);
    if (suffix) {
      return `${base}-${suffix}`;
    }
  }
  return `${base}-${generateListingSlugNanoid()}`;
}

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}
