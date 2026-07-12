export type UseCaseCatalogRow = Readonly<{
  key: string;
  parentUseCaseKey: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | string;
}>;

export type UseCaseHierarchyRow = Readonly<{
  key: string;
  parentUseCaseKey: string | null;
}>;

export type UseCaseActiveHierarchyRow = UseCaseHierarchyRow &
  Readonly<{
    isActive: boolean;
  }>;

export type ListingUseCaseNormalizationFailure =
  | Readonly<{ kind: 'duplicate_or_empty' }>
  | Readonly<{ kind: 'not_found'; key: string }>;

export class ListingUseCaseNormalizationError extends Error {
  readonly failure: ListingUseCaseNormalizationFailure;

  constructor(failure: ListingUseCaseNormalizationFailure) {
    super(failure.kind === 'not_found' ? `Use case not found: ${failure.key}` : 'Duplicate or empty use case keys');
    this.name = 'ListingUseCaseNormalizationError';
    this.failure = failure;
  }
}

/** Expands marketplace filter keys to include all descendants (parent filter matches child-tagged listings). */
export function expandUseCaseFilterKeys(
  filterKeys: readonly string[],
  catalogRows: readonly UseCaseHierarchyRow[],
): string[] {
  const expanded = new Set<string>();
  for (const rawKey of filterKeys) {
    const key = rawKey.trim();
    if (key.length === 0) {
      continue;
    }
    expanded.add(key);
    for (const descendant of collectDescendantKeys(catalogRows, key)) {
      expanded.add(descendant);
    }
  }
  return Array.from(expanded);
}

export function collectDescendantKeys(rows: readonly UseCaseHierarchyRow[], rootKey: string): readonly string[] {
  const childrenByParent = new Map<string | null, string[]>();
  for (const row of rows) {
    const parentKey = row.parentUseCaseKey;
    const siblings = childrenByParent.get(parentKey) ?? [];
    siblings.push(row.key);
    childrenByParent.set(parentKey, siblings);
  }

  const descendants: string[] = [];
  const stack = [...(childrenByParent.get(rootKey) ?? [])];
  while (stack.length > 0) {
    const key = stack.pop();
    if (key === undefined) {
      continue;
    }
    descendants.push(key);
    const children = childrenByParent.get(key);
    if (children) {
      stack.push(...children);
    }
  }

  return descendants;
}

export function isPubliclyVisibleUseCase(
  activeRows: readonly UseCaseActiveHierarchyRow[],
  key: string,
): boolean {
  const byKey = new Map(activeRows.map((row) => [row.key, row]));
  const visiting = new Set<string>();

  const check = (nodeKey: string): boolean => {
    if (visiting.has(nodeKey)) {
      return false;
    }
    visiting.add(nodeKey);
    const row = byKey.get(nodeKey);
    if (!row || !row.isActive) {
      visiting.delete(nodeKey);
      return false;
    }
    if (row.parentUseCaseKey === null) {
      visiting.delete(nodeKey);
      return true;
    }
    const visible = check(row.parentUseCaseKey);
    visiting.delete(nodeKey);
    return visible;
  };

  return check(key);
}

export function filterPubliclyVisibleUseCases<T extends UseCaseActiveHierarchyRow>(activeRows: readonly T[]): T[] {
  return activeRows.filter((row) => isPubliclyVisibleUseCase(activeRows, row.key));
}

export function sortUseCasesDepthFirst<T extends UseCaseCatalogRow>(rows: readonly T[]): T[] {
  const childrenByParent = new Map<string | null, T[]>();
  for (const row of rows) {
    const parentKey = row.parentUseCaseKey;
    const siblings = childrenByParent.get(parentKey) ?? [];
    siblings.push(row);
    childrenByParent.set(parentKey, siblings);
  }

  const compareSiblings = (a: T, b: T): number => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    const aCreated = a.createdAt instanceof Date ? a.createdAt.getTime() : Date.parse(String(a.createdAt));
    const bCreated = b.createdAt instanceof Date ? b.createdAt.getTime() : Date.parse(String(b.createdAt));
    return bCreated - aCreated;
  };

  const visit = (parentKey: string | null): T[] => {
    const siblings = [...(childrenByParent.get(parentKey) ?? [])].sort(compareSiblings);
    return siblings.flatMap((row) => [row, ...visit(row.key)]);
  };

  return visit(null);
}

function normalizeUseCaseKey(value: string): string {
  return value.trim().toLowerCase();
}

function resolveRequestedUseCaseKeys(
  requestedKeys: readonly string[],
  visibleCatalog: readonly UseCaseCatalogRow[],
): Set<string> {
  const catalogByNormalizedKey = new Map(visibleCatalog.map((row) => [normalizeUseCaseKey(row.key), row.key]));
  const requested = new Set<string>();

  for (const rawKey of requestedKeys) {
    const normalized = normalizeUseCaseKey(rawKey);
    if (normalized.length === 0) {
      throw new ListingUseCaseNormalizationError({ kind: 'duplicate_or_empty' });
    }

    const canonicalKey = catalogByNormalizedKey.get(normalized);
    if (!canonicalKey) {
      throw new ListingUseCaseNormalizationError({ kind: 'not_found', key: rawKey.trim() });
    }

    if (requested.has(canonicalKey)) {
      throw new ListingUseCaseNormalizationError({ kind: 'duplicate_or_empty' });
    }

    requested.add(canonicalKey);
  }

  return requested;
}

/**
 * Applies listing use-case selection rules (L4–L6) before persisting junction rows.
 * Repairs incomplete client payloads (parent-only → full subtree; child-only → parent + child).
 */
export function normalizeListingUseCaseKeys(
  requestedKeys: readonly string[],
  catalogRows: readonly UseCaseCatalogRow[],
): string[] {
  const visibleCatalog = filterPubliclyVisibleUseCases(catalogRows);
  const requested = resolveRequestedUseCaseKeys(requestedKeys, visibleCatalog);

  if (requested.size === 0) {
    return [];
  }

  const output = new Set<string>();
  const hierarchyRows = visibleCatalog.map((row) => ({
    key: row.key,
    parentUseCaseKey: row.parentUseCaseKey,
  }));

  const processNode = (nodeKey: string): void => {
    const allDesc = collectDescendantKeys(hierarchyRows, nodeKey);
    const selectedDesc = allDesc.filter((key) => requested.has(key));
    const parentInRequest = requested.has(nodeKey);
    const allDescSelected = allDesc.length > 0 && selectedDesc.length === allDesc.length;

    if (parentInRequest || allDescSelected) {
      output.add(nodeKey);
      for (const desc of allDesc) {
        output.add(desc);
      }
      return;
    }

    if (selectedDesc.length > 0) {
      output.add(nodeKey);
      for (const desc of selectedDesc) {
        output.add(desc);
      }
    }

    const directChildren = visibleCatalog.filter((row) => row.parentUseCaseKey === nodeKey);
    for (const child of directChildren) {
      processNode(child.key);
    }
  };

  const roots = visibleCatalog.filter((row) => row.parentUseCaseKey === null);
  for (const root of roots) {
    processNode(root.key);
  }

  return sortUseCasesDepthFirst(visibleCatalog.filter((row) => output.has(row.key))).map((row) => row.key);
}

export function formatUseCaseKeysPreview(
  useCaseKeys: readonly string[],
  useCases: readonly Readonly<{ key: string; name: string; parentUseCaseKey: string | null; sortOrder?: number; createdAt?: Date | string }>[],
): string[] {
  if (useCaseKeys.length === 0) {
    return [];
  }

  const byKey = new Map(useCases.map((row) => [row.key, row]));
  const selected = new Set(useCaseKeys);

  const findRootKey = (key: string): string => {
    let current: string = key;
    const visited = new Set<string>();
    while (true) {
      if (visited.has(current)) {
        return current;
      }
      visited.add(current);
      const row = byKey.get(current);
      if (!row || row.parentUseCaseKey === null) {
        return current;
      }
      current = row.parentUseCaseKey;
    }
  };

  const compareRows = (
    a: Readonly<{ sortOrder?: number; createdAt?: Date | string; key: string }>,
    b: Readonly<{ sortOrder?: number; createdAt?: Date | string; key: string }>,
  ): number => {
    const sortOrderA = a.sortOrder ?? 0;
    const sortOrderB = b.sortOrder ?? 0;
    if (sortOrderA !== sortOrderB) {
      return sortOrderA - sortOrderB;
    }
    const createdA = a.createdAt instanceof Date ? a.createdAt.getTime() : Date.parse(String(a.createdAt ?? 0));
    const createdB = b.createdAt instanceof Date ? b.createdAt.getTime() : Date.parse(String(b.createdAt ?? 0));
    if (createdA !== createdB) {
      return createdB - createdA;
    }
    return a.key.localeCompare(b.key);
  };

  const leafKeys = useCaseKeys.filter((key) => {
    const hasSelectedChild = useCases.some(
      (row) => row.parentUseCaseKey === key && selected.has(row.key),
    );
    return !hasSelectedChild;
  });

  const leavesByRoot = new Map<string, string[]>();
  for (const leafKey of leafKeys) {
    const rootKey = findRootKey(leafKey);
    const group = leavesByRoot.get(rootKey) ?? [];
    group.push(leafKey);
    leavesByRoot.set(rootKey, group);
  }

  const rootKeys = Array.from(leavesByRoot.keys()).sort((keyA, keyB) => {
    const rowA = byKey.get(keyA);
    const rowB = byKey.get(keyB);
    if (!rowA || !rowB) {
      return keyA.localeCompare(keyB);
    }
    return compareRows(rowA, rowB);
  });

  const lines: string[] = [];
  for (const rootKey of rootKeys) {
    const rootRow = byKey.get(rootKey);
    if (!rootRow) {
      continue;
    }

    const leafKeysForRoot = leavesByRoot.get(rootKey) ?? [];
    const descendantLeafKeys = leafKeysForRoot.filter((key) => key !== rootKey);

    if (descendantLeafKeys.length === 0 && leafKeysForRoot.includes(rootKey)) {
      lines.push(rootRow.name);
      continue;
    }

    const childNames = descendantLeafKeys
      .map((key) => byKey.get(key))
      .filter((row): row is NonNullable<typeof row> => row !== undefined)
      .sort(compareRows)
      .map((row) => row.name);

    if (childNames.length > 0) {
      lines.push(`${rootRow.name} > ${childNames.join(', ')}`);
    }
  }

  return lines;
}
