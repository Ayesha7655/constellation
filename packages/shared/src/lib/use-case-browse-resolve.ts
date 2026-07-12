export type UseCaseBrowseCatalogRow = Readonly<{
  key: string;
  name: string;
  parentUseCaseKey: string | null;
}>;

export type UseCaseBrowseBrandRow = Readonly<{
  manufacturerKey: string;
  manufacturerName: string;
  hqCountry: string | null;
  listingCount: number;
}>;

export type ResolvedUseCaseBrowseSegments = Readonly<{
  useCaseKeys: readonly string[];
  manufacturerKey?: string;
}>;

export type ParsedUseCaseBrowsePath = Readonly<{
  path: ResolvedUseCaseBrowseSegments;
  useCaseChain: readonly UseCaseBrowseCatalogRow[];
  brand?: UseCaseBrowseBrandRow;
  /** Both taxonomy and brand interpretations were valid for the same URL. */
  ambiguous?: boolean;
}>;

export function validateUseCaseChainFromCatalog(
  catalog: readonly UseCaseBrowseCatalogRow[],
  keys: readonly string[],
): readonly UseCaseBrowseCatalogRow[] | null {
  if (keys.length === 0) {
    return null;
  }

  const byKey = new Map(catalog.map((row) => [row.key, row]));
  const rootKey = keys[0];
  if (!rootKey) {
    return null;
  }

  const root = byKey.get(rootKey);
  if (!root || root.parentUseCaseKey !== null) {
    return null;
  }

  const chain: UseCaseBrowseCatalogRow[] = [root];
  for (let index = 1; index < keys.length; index += 1) {
    const parentKey = keys[index - 1];
    const key = keys[index];
    if (!parentKey || !key) {
      return null;
    }
    const node = byKey.get(key);
    if (!node || node.parentUseCaseKey !== parentKey) {
      return null;
    }
    chain.push(node);
  }

  return chain;
}

export function isDirectChildUseCase(
  catalog: readonly UseCaseBrowseCatalogRow[],
  parentKey: string,
  childKey: string,
): boolean {
  const node = catalog.find((row) => row.key === childKey);
  return node?.parentUseCaseKey === parentKey;
}

function resolveBrandBrowsePath(
  catalog: readonly UseCaseBrowseCatalogRow[],
  segments: readonly string[],
  brandCountsForLeaf: readonly UseCaseBrowseBrandRow[],
): ParsedUseCaseBrowsePath | null {
  if (segments.length < 2) {
    return null;
  }

  const useCaseKeys = segments.slice(0, -1);
  const manufacturerKey = segments[segments.length - 1];
  if (!manufacturerKey) {
    return null;
  }

  const chain = validateUseCaseChainFromCatalog(catalog, useCaseKeys);
  const leafKey = useCaseKeys[useCaseKeys.length - 1];
  if (!chain || !leafKey) {
    return null;
  }

  const brand = brandCountsForLeaf.find(
    (entry) => entry.manufacturerKey === manufacturerKey && entry.listingCount > 0,
  );
  if (!brand) {
    return null;
  }

  return {
    path: { useCaseKeys, manufacturerKey },
    useCaseChain: chain,
    brand,
  };
}

/**
 * Resolves URL segments to a taxonomy or brand browse path.
 * When a segment matches both a child use case and a manufacturer for the parent leaf, taxonomy wins.
 */
export function resolveUseCaseBrowseSegmentsFromCatalog(
  catalog: readonly UseCaseBrowseCatalogRow[],
  segments: readonly string[],
  brandCountsForLeaf?: readonly UseCaseBrowseBrandRow[],
): ParsedUseCaseBrowsePath | null {
  if (segments.length === 0) {
    return null;
  }

  const taxonomyPath = validateUseCaseChainFromCatalog(catalog, segments);
  const brandPath =
    brandCountsForLeaf !== undefined ? resolveBrandBrowsePath(catalog, segments, brandCountsForLeaf) : null;

  if (taxonomyPath && brandPath) {
    const parentKey = segments[segments.length - 2];
    const lastKey = segments[segments.length - 1];
    if (parentKey && lastKey && isDirectChildUseCase(catalog, parentKey, lastKey)) {
      return {
        path: { useCaseKeys: segments },
        useCaseChain: taxonomyPath,
        ambiguous: true,
      };
    }
    return brandPath;
  }

  if (taxonomyPath) {
    return {
      path: { useCaseKeys: segments },
      useCaseChain: taxonomyPath,
    };
  }

  if (brandPath) {
    return brandPath;
  }

  if (segments.length >= 2 && brandCountsForLeaf === undefined) {
    const useCaseKeys = segments.slice(0, -1);
    const chain = validateUseCaseChainFromCatalog(catalog, useCaseKeys);
    if (chain) {
      return null;
    }
  }

  return null;
}
