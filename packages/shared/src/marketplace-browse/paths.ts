export type ManufacturerBrowsePath = Readonly<{
  manufacturerKey: string;
}>;

export function buildManufacturerBrowsePath(path: ManufacturerBrowsePath): string {
  return `/brands/${path.manufacturerKey}`;
}

export function isManufacturerBrowseSegment(segment: string): boolean {
  return segment === 'brands';
}

/** @deprecated Old public URL segment — use {@link isManufacturerBrowseSegment} (`brands`). */
export function isLegacyManufacturerBrowseSegment(segment: string): boolean {
  return segment === 'manufacturers';
}
