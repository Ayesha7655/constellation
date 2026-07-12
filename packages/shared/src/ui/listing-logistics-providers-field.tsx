'use client';

import { FormikMultiSelectDropdownField } from './formik-multi-select-dropdown-field';
import type { MultiSelectDropdownOption } from './multi-select-dropdown';

export function ListingLogisticsProvidersField({
  name,
  label,
  options,
  ariaLabel,
  placeholder,
  emptyMessage,
  testId = 'listing-logistics-providers',
  className,
}: Readonly<{
  name?: string;
  label: string;
  options: readonly MultiSelectDropdownOption[];
  ariaLabel: string;
  placeholder: string;
  emptyMessage?: string;
  testId?: string;
  className?: string;
}>) {
  return (
    <div className={className}>
      <FormikMultiSelectDropdownField
        name={name ?? 'logisticsProviderKeys'}
        label={label}
        options={options}
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        testId={testId}
      />
    </div>
  );
}
