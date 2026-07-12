/** Default page size when the client does not send `limit`. */
export const DEFAULT_PAGE_SIZE = 20;

/** Hard cap for `limit` on paginated list endpoints. */
export const MAX_PAGE_SIZE = 100;

/** First page number (1-based). */
export const MIN_PAGE = 1;

export type PaginationMeta = Readonly<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export type PaginationQuery = Readonly<{
  page?: number;
  limit?: number;
}>;

export type ResolvedPagination = Readonly<{
  page: number;
  limit: number;
  offset: number;
  skip: number;
  take: number;
}>;

export function computeOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function computeTotalPages(total: number, limit: number): number {
  if (total <= 0 || limit <= 0) {
    return 0;
  }
  return Math.ceil(total / limit);
}

export function resolvePagination(query: PaginationQuery, maxLimit: number = MAX_PAGE_SIZE): ResolvedPagination {
  const page = query.page ?? MIN_PAGE;
  const rawLimit = query.limit ?? DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const offset = computeOffset(page, limit);
  return { page, limit, offset, skip: offset, take: limit };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: computeTotalPages(total, limit),
  };
}
