export type UseCaseBrowsePath = Readonly<{
  useCaseKeys: readonly string[];
  manufacturerKey?: string;
}>;

export function isUseCaseBrandBrowsePage(path: UseCaseBrowsePath): boolean {
  return Boolean(path.manufacturerKey?.trim());
}

export function getUseCaseBrowseLeafKey(path: UseCaseBrowsePath): string {
  const leafKey = path.useCaseKeys.at(-1);
  if (!leafKey) {
    throw new Error('Use case browse path requires at least one use case key');
  }
  return leafKey;
}

export function buildUseCaseBrowsePath(path: UseCaseBrowsePath): string {
  const segments = [...path.useCaseKeys];
  if (path.manufacturerKey) {
    segments.push(path.manufacturerKey);
  }
  return `/${segments.join('/')}`;
}

export function buildUseCaseChildHref(parentUseCaseKeys: readonly string[], childKey: string): string {
  return buildUseCaseBrowsePath({ useCaseKeys: [...parentUseCaseKeys, childKey] });
}

export function buildUseCaseBrandHref(useCaseKeys: readonly string[], manufacturerKey: string): string {
  return buildUseCaseBrowsePath({ useCaseKeys, manufacturerKey });
}

export function resolveUseCaseBrowseHrefPath(path: UseCaseBrowsePath, manufacturerKey: string): UseCaseBrowsePath {
  if (manufacturerKey) {
    return { useCaseKeys: path.useCaseKeys, manufacturerKey };
  }
  return { useCaseKeys: path.useCaseKeys };
}

/** @deprecated Use buildUseCaseBrowsePath */
export function buildUsecasePath(path: UseCaseBrowsePath): string {
  return buildUseCaseBrowsePath(path);
}

/** @deprecated Use buildUseCaseChildHref */
export function buildUsecaseChildHref(parentUseCaseKeys: readonly string[], childKey: string): string {
  return buildUseCaseChildHref(parentUseCaseKeys, childKey);
}
