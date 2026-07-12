export type UseCaseTreeNode = Readonly<{
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  parentUseCaseKey: string | null;
  depth: number;
  parentName?: string | null;
  descendantCount?: number;
  directChildCount?: number;
  createdAt: string;
  updatedAt: string;
}>;

export function resolveUseCaseMaxDepthClient(): number {
  const raw = process.env.NEXT_PUBLIC_USE_CASE_MAX_DEPTH;
  if (raw === undefined || raw.trim() === '') {
    return 1;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.min(10, Math.max(1, parsed));
}

export const USE_CASE_TREE_INDENT_REM = 1.5;

function buildChildrenByParent(useCases: readonly UseCaseTreeNode[]): Map<string | null, UseCaseTreeNode[]> {
  const childrenByParent = new Map<string | null, UseCaseTreeNode[]>();
  for (const row of useCases) {
    const parentKey = row.parentUseCaseKey;
    const siblings = childrenByParent.get(parentKey) ?? [];
    siblings.push(row);
    childrenByParent.set(parentKey, siblings);
  }
  return childrenByParent;
}

function compareUseCaseSiblings(a: UseCaseTreeNode, b: UseCaseTreeNode): number {
  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

export function countDirectChildren(
  useCases: readonly Pick<UseCaseTreeNode, 'key' | 'parentUseCaseKey'>[],
  parentKey: string,
): number {
  return useCases.filter((row) => row.parentUseCaseKey === parentKey).length;
}

export function hasDirectChildren(
  useCases: readonly Pick<UseCaseTreeNode, 'key' | 'parentUseCaseKey'>[],
  key: string,
): boolean {
  return countDirectChildren(useCases, key) > 0;
}

/** DFS rows respecting expand/collapse — default `expandedKeys` empty shows roots only. */
export function buildVisibleUseCaseRows(
  useCases: readonly UseCaseTreeNode[],
  expandedKeys: ReadonlySet<string>,
): UseCaseTreeNode[] {
  const childrenByParent = buildChildrenByParent(useCases);

  const visit = (parentKey: string | null, depth: number): UseCaseTreeNode[] => {
    const siblings = [...(childrenByParent.get(parentKey) ?? [])].sort(compareUseCaseSiblings);
    return siblings.flatMap((row) => {
      const node: UseCaseTreeNode = { ...row, depth };
      if (!expandedKeys.has(row.key)) {
        return [node];
      }
      return [node, ...visit(row.key, depth + 1)];
    });
  };

  return visit(null, 0);
}

export function flattenUseCasesForDisplay(useCases: readonly UseCaseTreeNode[]): UseCaseTreeNode[] {
  return buildVisibleUseCaseRows(useCases, new Set(Array.from(useCases, (row) => row.key)));
}
export function collectDescendantKeysFromFlat(
  useCases: readonly Pick<UseCaseTreeNode, 'key' | 'parentUseCaseKey'>[],
  rootKey: string,
): readonly string[] {
  const childrenByParent = new Map<string | null, string[]>();
  for (const row of useCases) {
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

export function isDescendantKey(
  useCases: readonly Pick<UseCaseTreeNode, 'key' | 'parentUseCaseKey'>[],
  ancestorKey: string,
  candidateKey: string,
): boolean {
  if (ancestorKey === candidateKey) {
    return true;
  }
  return collectDescendantKeysFromFlat(useCases, ancestorKey).includes(candidateKey);
}

export function getEligibleParentOptions(
  useCases: readonly UseCaseTreeNode[],
  options: Readonly<{ editingKey?: string; maxDepth: number }>,
): readonly UseCaseTreeNode[] {
  return useCases.filter((row) => {
    if (options.editingKey !== undefined && row.key === options.editingKey) {
      return false;
    }
    if (options.editingKey !== undefined && isDescendantKey(useCases, options.editingKey, row.key)) {
      return false;
    }
    if ((row.depth ?? 0) >= options.maxDepth) {
      return false;
    }
    return true;
  });
}

export function applySiblingReorder(
  useCases: readonly UseCaseTreeNode[],
  parentKey: string | null,
  reorderedSiblings: readonly UseCaseTreeNode[],
): UseCaseTreeNode[] {
  const orderByKey = new Map(reorderedSiblings.map((row, index) => [row.key, index + 1] as const));
  return useCases.map((row) => {
    const nextOrder = orderByKey.get(row.key);
    if (row.parentUseCaseKey === parentKey && nextOrder !== undefined) {
      return { ...row, sortOrder: nextOrder };
    }
    return row;
  });
}

export function canAddChildUseCase(depth: number | undefined, maxDepth: number): boolean {
  return (depth ?? 0) < maxDepth;
}
