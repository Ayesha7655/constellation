'use client';

import type { ReactNode } from 'react';
import { Dropdown, FormField, type DropdownOption } from '@constellation/shared/ui';

export type ListingBasicIdentityLabels = Readonly<{
  stepTitle: string;
  titleField: ReactNode;
  titleHint: string;
  manufacturerLabel: string;
  manufacturerAriaLabel: string;
  manufacturerPlaceholder: string;
  modelLabel: string;
  modelAriaLabel: string;
  modelSelectManufacturerFirst: string;
}>;

export function ListingBasicIdentitySection({
  labels,
  manufacturerFieldId,
  manufacturerValue,
  manufacturerOptions,
  onManufacturerChange,
  showManufacturerError,
  manufacturerError,
  modelFieldId,
  modelValue,
  modelOptions,
  onModelChange,
  modelDisabled,
  showModelError,
  modelError,
  countryField,
  cityField,
  modelDetails,
}: Readonly<{
  labels: ListingBasicIdentityLabels;
  manufacturerFieldId: string;
  manufacturerValue: string;
  manufacturerOptions: readonly DropdownOption[];
  onManufacturerChange: (value: string) => void;
  showManufacturerError: boolean;
  manufacturerError?: string;
  modelFieldId: string;
  modelValue: string;
  modelOptions: readonly DropdownOption[];
  onModelChange: (value: string) => void;
  modelDisabled: boolean;
  showModelError: boolean;
  modelError?: string;
  countryField: ReactNode;
  cityField: ReactNode;
  modelDetails?: ReactNode;
}>) {
  return (
    <section className="relative space-y-4">
      <h3 className="text-base font-semibold text-foreground">{labels.stepTitle}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          {labels.titleField}
          <p className="text-sm text-muted-foreground">{labels.titleHint}</p>
        </div>
        <FormField
          id={manufacturerFieldId}
          label={labels.manufacturerLabel}
          error={manufacturerError}
          touched={showManufacturerError}
        >
          <Dropdown
            value={manufacturerValue}
            options={manufacturerOptions}
            onChange={onManufacturerChange}
            ariaLabel={labels.manufacturerAriaLabel}
            className="w-full"
            triggerClassName={showManufacturerError ? 'w-full border-destructive' : 'w-full'}
          />
        </FormField>
        <FormField
          id={modelFieldId}
          label={labels.modelLabel}
          error={modelError}
          touched={showModelError}
        >
          <Dropdown
            value={modelValue}
            options={modelOptions}
            onChange={onModelChange}
            ariaLabel={labels.modelAriaLabel}
            disabled={modelDisabled}
            className="w-full"
            triggerClassName={showModelError ? 'w-full border-destructive' : 'w-full'}
          />
        </FormField>
        {countryField}
        {cityField}
        {modelDetails}
      </div>
    </section>
  );
}
