'use client';

import { useCallback, useMemo } from 'react';
import { PUBLIC_MARKETPLACE_LISTING_CONDITION, type PublicMarketplaceListingCondition } from '../robot-listings';
import { TEST_IDS } from '../test-ids';
import {
  isMarketplacePriceRangeInvalid,
  isUsedOnlyMarketplaceCondition,
  type MarketplaceBrowseFilterCatalogOption,
  type MarketplaceBrowseFilterSidebarLabels,
  type MarketplaceBrowseFilters,
} from '../marketplace-browse/filters';
import { Checkbox } from './checkbox';
import { Dropdown } from './dropdown';
import { MultiSelectDropdown } from './multi-select-dropdown';
import { cn } from '../lib/utils';

export type MarketplaceBrowseFilterSidebarContentProps = Readonly<{
  countries: readonly MarketplaceBrowseFilterCatalogOption[];
  useCases: readonly MarketplaceBrowseFilterCatalogOption[];
  usedConditions: readonly MarketplaceBrowseFilterCatalogOption[];
  manufacturers: readonly MarketplaceBrowseFilterCatalogOption[];
  models: readonly MarketplaceBrowseFilterCatalogOption[];
  filters: MarketplaceBrowseFilters;
  onFiltersChange: (filters: MarketplaceBrowseFilters) => void;
  labels: MarketplaceBrowseFilterSidebarLabels;
  lockManufacturerKey?: string;
  hideUseCaseFilters?: boolean;
  className?: string;
}>;

export function MarketplaceBrowseFilterSidebarContent({
  countries,
  useCases,
  usedConditions,
  manufacturers,
  models,
  filters,
  onFiltersChange,
  labels,
  lockManufacturerKey,
  hideUseCaseFilters = false,
  className,
}: MarketplaceBrowseFilterSidebarContentProps) {
  const showUsedConditionTypes = isUsedOnlyMarketplaceCondition(filters.conditions);
  const priceRangeInvalid = isMarketplacePriceRangeInvalid(filters);

  const onPriceMinChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ ...filters, priceMin: event.target.value });
    },
    [filters, onFiltersChange],
  );

  const onPriceMaxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ ...filters, priceMax: event.target.value });
    },
    [filters, onFiltersChange],
  );

  const onCountryKeysChange = useCallback(
    (countryKeys: readonly string[]) => {
      onFiltersChange({ ...filters, countryKeys });
    },
    [filters, onFiltersChange],
  );

  const onUseCaseKeysChange = useCallback(
    (useCaseKeys: readonly string[]) => {
      onFiltersChange({ ...filters, useCaseKeys });
    },
    [filters, onFiltersChange],
  );

  const onUsedConditionKeysChange = useCallback(
    (usedConditionKeys: readonly string[]) => {
      onFiltersChange({ ...filters, usedConditionKeys });
    },
    [filters, onFiltersChange],
  );

  const onConditionToggle = useCallback(
    (key: PublicMarketplaceListingCondition) => {
      const nextConditions = filters.conditions.includes(key)
        ? filters.conditions.filter((entry) => entry !== key)
        : [...filters.conditions, key];
      onFiltersChange({
        ...filters,
        conditions: nextConditions,
        usedConditionKeys: isUsedOnlyMarketplaceCondition(nextConditions) ? filters.usedConditionKeys : [],
      });
    },
    [filters, onFiltersChange],
  );

  const onManufacturerChange = useCallback(
    (manufacturerKey: string) => {
      onFiltersChange({
        ...filters,
        manufacturerKey,
        modelKey: manufacturerKey && manufacturerKey === filters.manufacturerKey ? filters.modelKey : '',
      });
    },
    [filters, onFiltersChange],
  );

  const onModelChange = useCallback(
    (modelKey: string) => {
      onFiltersChange({ ...filters, modelKey });
    },
    [filters, onFiltersChange],
  );

  const effectiveManufacturerKey = lockManufacturerKey ?? filters.manufacturerKey;

  const countryOptions = useMemo(
    () => countries.map((country) => ({ value: country.key, label: country.name })),
    [countries],
  );

  const useCaseOptions = useMemo(
    () => useCases.map((useCase) => ({ value: useCase.key, label: useCase.name })),
    [useCases],
  );

  const usedConditionOptions = useMemo(
    () => usedConditions.map((usedCondition) => ({ value: usedCondition.key, label: usedCondition.name })),
    [usedConditions],
  );

  const manufacturerOptions = useMemo(
    () => [{ value: '', label: labels.manufacturerAny }, ...manufacturers.map((m) => ({ value: m.key, label: m.name }))],
    [labels.manufacturerAny, manufacturers],
  );

  const modelOptions = useMemo(
    () => [{ value: '', label: labels.modelAny }, ...models.map((m) => ({ value: m.key, label: m.name }))],
    [labels.modelAny, models],
  );

  const multiSelectSummary = labels.multiSelectSummary;

  return (
    <div className={cn('divide-y divide-border', className)}>
      <section className="space-y-2 pb-6">
        <h3 className="text-sm font-medium text-foreground">{labels.price}</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={filters.priceMin}
            onChange={onPriceMinChange}
            placeholder={labels.priceMin}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
            data-testid={TEST_IDS.marketplace.browse.filterPriceMin}
            aria-label={labels.priceMin}
            aria-invalid={priceRangeInvalid}
          />
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={filters.priceMax}
            onChange={onPriceMaxChange}
            placeholder={labels.priceMax}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
            data-testid={TEST_IDS.marketplace.browse.filterPriceMax}
            aria-label={labels.priceMax}
            aria-invalid={priceRangeInvalid}
          />
        </div>
        {priceRangeInvalid ? (
          <p className="text-sm text-destructive" data-testid={TEST_IDS.marketplace.browse.filterPriceRangeError}>
            {labels.priceRangeInvalid}
          </p>
        ) : null}
      </section>

      <section className="space-y-2 py-6">
        <h3 className="text-sm font-medium text-foreground">{labels.country}</h3>
        <MultiSelectDropdown
          options={countryOptions}
          selectedValues={filters.countryKeys}
          onChange={onCountryKeysChange}
          ariaLabel={labels.country}
          placeholder={labels.countryPlaceholder}
          emptyMessage={labels.catalogEmpty}
          selectedSummary={multiSelectSummary}
          fullWidth
          testId={TEST_IDS.marketplace.browse.filterCountries}
        />
      </section>

      <section className="space-y-2 py-6">
        <h3 className="text-sm font-medium text-foreground">{labels.condition}</h3>
        <ul className="space-y-2">
          <li>
            <Checkbox
              checked={filters.conditions.includes(PUBLIC_MARKETPLACE_LISTING_CONDITION.NEW)}
              onCheckedChange={() => onConditionToggle(PUBLIC_MARKETPLACE_LISTING_CONDITION.NEW)}
              label={labels.conditionNew}
              testId={TEST_IDS.marketplace.browse.filterCondition(PUBLIC_MARKETPLACE_LISTING_CONDITION.NEW)}
            />
          </li>
          <li>
            <Checkbox
              checked={filters.conditions.includes(PUBLIC_MARKETPLACE_LISTING_CONDITION.USED)}
              onCheckedChange={() => onConditionToggle(PUBLIC_MARKETPLACE_LISTING_CONDITION.USED)}
              label={labels.conditionUsed}
              testId={TEST_IDS.marketplace.browse.filterCondition(PUBLIC_MARKETPLACE_LISTING_CONDITION.USED)}
            />
          </li>
        </ul>
        {showUsedConditionTypes ? (
          <div className="space-y-2 border-s-2 border-border ps-3">
            <h4 className="text-sm font-medium text-foreground">{labels.usedConditionType}</h4>
            <MultiSelectDropdown
              options={usedConditionOptions}
              selectedValues={filters.usedConditionKeys}
              onChange={onUsedConditionKeysChange}
              ariaLabel={labels.usedConditionType}
              placeholder={labels.usedConditionPlaceholder}
              emptyMessage={labels.catalogEmpty}
              selectedSummary={multiSelectSummary}
              fullWidth
              testId={TEST_IDS.marketplace.browse.filterUsedConditions}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-2 py-6">
        <h3 className="text-sm font-medium text-foreground">{labels.manufacturer}</h3>
        <Dropdown
          value={effectiveManufacturerKey}
          options={manufacturerOptions}
          onChange={onManufacturerChange}
          disabled={Boolean(lockManufacturerKey)}
          testId={TEST_IDS.marketplace.browse.manufacturer}
          ariaLabel={labels.manufacturer}
          fullWidth
        />
      </section>

      <section className="space-y-2 py-6">
        <h3 className="text-sm font-medium text-foreground">{labels.model}</h3>
        <Dropdown
          value={filters.modelKey}
          options={modelOptions}
          onChange={onModelChange}
          disabled={!effectiveManufacturerKey}
          testId={TEST_IDS.marketplace.browse.model}
          ariaLabel={labels.model}
          fullWidth
        />
      </section>

      {!hideUseCaseFilters ? (
        <section className="space-y-2 pt-6">
          <h3 className="text-sm font-medium text-foreground">{labels.useCase}</h3>
          <MultiSelectDropdown
            options={useCaseOptions}
            selectedValues={filters.useCaseKeys}
            onChange={onUseCaseKeysChange}
            ariaLabel={labels.useCase}
            placeholder={labels.useCasePlaceholder}
            emptyMessage={labels.catalogEmpty}
            selectedSummary={multiSelectSummary}
            fullWidth
            testId={TEST_IDS.marketplace.browse.filterUseCases}
          />
        </section>
      ) : null}
    </div>
  );
}

export type MarketplaceBrowseFilterSidebarProps = Readonly<{
  countries: readonly MarketplaceBrowseFilterCatalogOption[];
  useCases: readonly MarketplaceBrowseFilterCatalogOption[];
  usedConditions: readonly MarketplaceBrowseFilterCatalogOption[];
  manufacturers: readonly MarketplaceBrowseFilterCatalogOption[];
  models: readonly MarketplaceBrowseFilterCatalogOption[];
  filters: MarketplaceBrowseFilters;
  onFiltersChange: (filters: MarketplaceBrowseFilters) => void;
  labels: MarketplaceBrowseFilterSidebarLabels & Readonly<{ title: string }>;
  lockManufacturerKey?: string;
  hideUseCaseFilters?: boolean;
}>;

export function MarketplaceBrowseFilterSidebar({
  countries,
  useCases,
  usedConditions,
  manufacturers,
  models,
  filters,
  onFiltersChange,
  labels,
  lockManufacturerKey,
  hideUseCaseFilters,
}: MarketplaceBrowseFilterSidebarProps) {
  return (
    <aside
      className="hidden w-60 shrink-0 lg:block lg:sticky lg:top-6 lg:max-h-[calc(100dvh-5rem)] lg:self-start lg:overflow-y-auto"
      data-testid={TEST_IDS.marketplace.browse.filterSidebar}
    >
      <h2 className="mb-6 text-sm font-semibold text-foreground">{labels.title}</h2>
      <MarketplaceBrowseFilterSidebarContent
        countries={countries}
        useCases={useCases}
        usedConditions={usedConditions}
        manufacturers={manufacturers}
        models={models}
        filters={filters}
        onFiltersChange={onFiltersChange}
        labels={labels}
        lockManufacturerKey={lockManufacturerKey}
        hideUseCaseFilters={hideUseCaseFilters}
      />
    </aside>
  );
}
