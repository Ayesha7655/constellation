import type {
  DashboardNavConfig,
  DashboardNavGroup,
  DashboardNavSubGroup,
} from '@/lib/dashboard-nav';

function itemVisible(
  item: { permissionKey?: string; permissionAnyKeys?: readonly string[] },
  permissionKeys: ReadonlySet<string>,
): boolean {
  if (item.permissionAnyKeys && item.permissionAnyKeys.length > 0) {
    return item.permissionAnyKeys.some((key) => permissionKeys.has(key));
  }
  if (!item.permissionKey) {
    return true;
  }
  return permissionKeys.has(item.permissionKey);
}

function filterSubGroup(
  subGroup: DashboardNavSubGroup,
  permissionKeys: ReadonlySet<string>,
): DashboardNavSubGroup | null {
  const items = subGroup.items.filter((item) => itemVisible(item, permissionKeys));
  if (items.length === 0) {
    return null;
  }
  return { ...subGroup, items };
}

function filterGroup(group: DashboardNavGroup, permissionKeys: ReadonlySet<string>): DashboardNavGroup | null {
  const items = group.items.filter((item) => itemVisible(item, permissionKeys));
  const subGroups = (group.subGroups ?? [])
    .map((subGroup) => filterSubGroup(subGroup, permissionKeys))
    .filter((subGroup): subGroup is DashboardNavSubGroup => subGroup !== null);

  if (items.length === 0 && subGroups.length === 0) {
    return null;
  }

  return {
    ...group,
    items,
    subGroups: subGroups.length > 0 ? subGroups : undefined,
  };
}

export function filterDashboardNavByPermissions(
  config: DashboardNavConfig,
  permissionKeys: ReadonlySet<string>,
): DashboardNavConfig {
  const groups = config.groups
    .map((group) => filterGroup(group, permissionKeys))
    .filter((group): group is DashboardNavGroup => group !== null);

  return { ...config, groups };
}
