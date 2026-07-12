import { sortUseCasesDepthFirst } from './normalize-listing-use-case-keys';

export type UseCasePickerCatalogRow = Readonly<{
  key: string;
  parentUseCaseKey: string | null;
  sortOrder: number;
  createdAt: Date | string;
  isActive?: boolean;
}>;

export type UseCasePickerCheckState = 'checked' | 'indeterminate' | 'unchecked';

function catalogByKey(rows: readonly UseCasePickerCatalogRow[]): ReadonlyMap<string, UseCasePickerCatalogRow> {
  return new Map(rows.map((row) => [row.key, row]));
}

function collectAncestorKeys(
  key: string,
  byKey: ReadonlyMap<string, UseCasePickerCatalogRow>,
): readonly string[] {
  const ancestors: string[] = [];
  let current = byKey.get(key);

  while (current?.parentUseCaseKey) {
    ancestors.push(current.parentUseCaseKey);
    current = byKey.get(current.parentUseCaseKey);
  }

  return ancestors;
}

function directChildKeys(parentKey: string, catalog: readonly UseCasePickerCatalogRow[]): readonly string[] {
  return catalog.filter((row) => row.parentUseCaseKey === parentKey).map((row) => row.key);
}

function collectDescendantKeys(parentKey: string, catalog: readonly UseCasePickerCatalogRow[]): readonly string[] {
  const descendants: string[] = [];
  const stack = [...directChildKeys(parentKey, catalog)];
  while (stack.length > 0) {
    const childKey = stack.pop();
    if (childKey === undefined) {
      continue;
    }
    descendants.push(childKey);
    stack.push(...directChildKeys(childKey, catalog));
  }
  return descendants;
}

function allDirectChildrenSelected(
  parentKey: string,
  selected: ReadonlySet<string>,
  catalog: readonly UseCasePickerCatalogRow[],
): boolean {
  const children = directChildKeys(parentKey, catalog);
  if (children.length === 0) {
    return false;
  }
  return children.every((childKey) => selected.has(childKey));
}

function parentHasSelectedChild(
  parentKey: string,
  selected: ReadonlySet<string>,
  catalog: readonly UseCasePickerCatalogRow[],
): boolean {
  return directChildKeys(parentKey, catalog).some((childKey) => selected.has(childKey));
}

function sortPickerKeys(keys: readonly string[], catalog: readonly UseCasePickerCatalogRow[]): string[] {
  const keySet = new Set(keys);
  return sortUseCasesDepthFirst(
    catalog.map((row) => ({
      key: row.key,
      parentUseCaseKey: row.parentUseCaseKey,
      isActive: row.isActive ?? true,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
    })),
  )
    .filter((row) => keySet.has(row.key))
    .map((row) => row.key);
}

/** Checkbox state for one node against the flat selection array. */
export function resolveUseCasePickerCheckState(
  selectedKeys: readonly string[],
  key: string,
  catalog: readonly UseCasePickerCatalogRow[],
): UseCasePickerCheckState {
  const selected = new Set(selectedKeys);
  const descendants = collectDescendantKeys(key, catalog);
  const inArray = selected.has(key);

  if (descendants.length === 0) {
    return inArray ? 'checked' : 'unchecked';
  }

  if (!inArray) {
    return 'unchecked';
  }

  const selectedDescendantCount = descendants.filter((descKey) => selected.has(descKey)).length;
  if (selectedDescendantCount === 0 || selectedDescendantCount === descendants.length) {
    return 'checked';
  }

  return 'indeterminate';
}

/** Add a use case and every ancestor to the picker selection. */
export function selectUseCaseInPicker(
  selectedKeys: readonly string[],
  key: string,
  catalog: readonly UseCasePickerCatalogRow[],
): string[] {
  const byKey = catalogByKey(catalog);
  if (!byKey.has(key)) {
    return [...selectedKeys];
  }

  const next = new Set(selectedKeys);
  next.add(key);
  for (const ancestorKey of collectAncestorKeys(key, byKey)) {
    next.add(ancestorKey);
  }

  return sortPickerKeys(Array.from(next), catalog);
}

/** Select every descendant under a parent (ancestors unchanged; other branches untouched). */
export function completeUseCaseBranchInPicker(
  selectedKeys: readonly string[],
  key: string,
  catalog: readonly UseCasePickerCatalogRow[],
): string[] {
  const byKey = catalogByKey(catalog);
  if (!byKey.has(key)) {
    return [...selectedKeys];
  }

  const next = new Set(selectedKeys);
  next.add(key);
  for (const ancestorKey of collectAncestorKeys(key, byKey)) {
    next.add(ancestorKey);
  }
  for (const descKey of collectDescendantKeys(key, catalog)) {
    next.add(descKey);
  }

  return sortPickerKeys(Array.from(next), catalog);
}

/** Remove a use case; drop parents that no longer have any selected children. */
export function deselectUseCaseFromPicker(
  selectedKeys: readonly string[],
  key: string,
  catalog: readonly UseCasePickerCatalogRow[],
): string[] {
  const byKey = catalogByKey(catalog);
  const next = new Set(selectedKeys);
  const descendants = collectDescendantKeys(key, catalog);

  if (descendants.length > 0 && allDirectChildrenSelected(key, next, catalog)) {
    next.delete(key);
    for (const descKey of descendants) {
      next.delete(descKey);
    }
  } else {
    next.delete(key);
  }

  let parentKey = byKey.get(key)?.parentUseCaseKey ?? null;
  while (parentKey !== null) {
    if (!parentHasSelectedChild(parentKey, next, catalog)) {
      next.delete(parentKey);
      parentKey = byKey.get(parentKey)?.parentUseCaseKey ?? null;
    } else {
      break;
    }
  }

  return sortPickerKeys(Array.from(next), catalog);
}

/** Toggle one use case in the flat picker selection array. */
export function toggleUseCaseInPicker(
  selectedKeys: readonly string[],
  key: string,
  catalog: readonly UseCasePickerCatalogRow[],
): string[] {
  const state = resolveUseCasePickerCheckState(selectedKeys, key, catalog);

  if (state === 'unchecked') {
    if (collectDescendantKeys(key, catalog).length > 0) {
      return completeUseCaseBranchInPicker(selectedKeys, key, catalog);
    }
    return selectUseCaseInPicker(selectedKeys, key, catalog);
  }
  if (state === 'indeterminate') {
    return completeUseCaseBranchInPicker(selectedKeys, key, catalog);
  }
  return deselectUseCaseFromPicker(selectedKeys, key, catalog);
}

export function isUseCaseSelectedInPicker(selectedKeys: readonly string[], key: string): boolean {
  return selectedKeys.includes(key);
}
