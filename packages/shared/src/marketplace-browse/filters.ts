import {
  PUBLIC_MARKETPLACE_LISTING_CONDITION,
  type PublicMarketplaceListingCondition,
} from '../robot-listings';

export type MarketplaceBrowseFilters = Readonly<{
  q: string;
  countryKeys: readonly string[];
  useCaseKeys: readonly string[];
  usedConditionKeys: readonly string[];
  conditions: readonly PublicMarketplaceListingCondition[];
  priceMin: string;
  priceMax: string;
  manufacturerKey: string;
  modelKey: string;
}>;

export const EMPTY_MARKETPLACE_BROWSE_FILTERS: MarketplaceBrowseFilters = {
  q: '',
  countryKeys: [],
  useCaseKeys: [],
  usedConditionKeys: [],
  conditions: [],
  priceMin: '',
  priceMax: '',
  manufacturerKey: '',
  modelKey: '',
};

export function parseMarketplacePriceFilter(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
}

export function isMarketplacePriceRangeInvalid(filters: MarketplaceBrowseFilters): boolean {
  const priceMin = parseMarketplacePriceFilter(filters.priceMin);
  const priceMax = parseMarketplacePriceFilter(filters.priceMax);
  return priceMin !== undefined && priceMax !== undefined && priceMin > priceMax;
}

export function isUsedOnlyMarketplaceCondition(
  conditions: readonly PublicMarketplaceListingCondition[],
): boolean {
  return conditions.length === 1 && conditions[0] === PUBLIC_MARKETPLACE_LISTING_CONDITION.USED;
}

export function toggleMarketplaceFilterKey(keys: readonly string[], key: string): readonly string[] {
  return keys.includes(key) ? keys.filter((entry) => entry !== key) : [...keys, key];
}

export function toggleMarketplaceListingCondition(
  keys: readonly PublicMarketplaceListingCondition[],
  key: PublicMarketplaceListingCondition,
): readonly PublicMarketplaceListingCondition[] {
  return keys.includes(key) ? keys.filter((entry) => entry !== key) : [...keys, key];
}

export type MarketplaceBrowseFilterCatalogOption = Readonly<{
  key: string;
  name: string;
}>;

export type MarketplaceBrowseFilterSidebarLabels = Readonly<{
  price: string;
  priceMin: string;
  priceMax: string;
  priceRangeInvalid: string;
  country: string;
  countryPlaceholder: string;
  condition: string;
  conditionNew: string;
  conditionUsed: string;
  usedConditionType: string;
  usedConditionPlaceholder: string;
  useCase: string;
  useCasePlaceholder: string;
  manufacturer: string;
  manufacturerAny: string;
  model: string;
  modelAny: string;
  catalogEmpty: string;
  multiSelectSummary: (count: number, labels: readonly string[]) => string;
}>;
