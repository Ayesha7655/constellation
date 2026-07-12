import { LIST_TEXT_SEARCH_MAX_LENGTH } from '@constellation/shared';
import { Op } from 'sequelize';

export { LIST_TEXT_SEARCH_MAX_LENGTH };

export function normalizeListSearchTerm(q?: string): string | undefined {
  const trimmed = q?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, LIST_TEXT_SEARCH_MAX_LENGTH);
}

export function buildUserTextSearchWhere(searchTerm: string): Record<string, unknown> {
  return {
    [Op.or]: [{ email: { [Op.iLike]: `%${searchTerm}%` } }, { name: { [Op.iLike]: `%${searchTerm}%` } }],
  };
}
