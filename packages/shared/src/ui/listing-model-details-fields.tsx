'use client';

import type { ReactNode } from 'react';
import { FormikMultiSelectDropdownField } from './formik-multi-select-dropdown-field';

export type ListingModelSpecField = Readonly<{
  key: string;
  label: string;
  hint?: string | null;
  placeholder?: string | null;
  unit?: string | null;
  valueType: 'text' | 'integer' | 'decimal' | 'boolean' | 'file';
  isEditableOnListing: boolean;
}>;

export type ListingModelDetailsLabels = Readonly<{
  specsHeading: string;
  specsModelHint: string;
  specsNoModelHint: string;
  sensorsLabel: string;
  sensorsHint: string;
  useCasesLabel: string;
  useCasesHint: string;
  multiSelectPlaceholder: string;
  multiSelectEmptyMessage: string;
}>;

export function ListingModelDetailsFields({
  specFields,
  sensors,
  hasModelSelected,
  labels,
  renderSpecFields,
}: Readonly<{
  specFields: readonly ListingModelSpecField[];
  sensors: readonly { key: string; name: string }[];
  hasModelSelected: boolean;
  labels: ListingModelDetailsLabels;
  renderSpecFields: (fields: readonly ListingModelSpecField[]) => ReactNode;
}>) {
  const showSpecs = specFields.length > 0;
  const showSensors = sensors.length > 0;

  if (!showSpecs && !showSensors) {
    return null;
  }

  const sensorOptions = sensors.map((sensor) => ({ value: sensor.key, label: sensor.name }));

  return (
    <div className="space-y-4 border-t border-border pt-4 sm:col-span-2">
      {showSpecs ? (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-foreground">{labels.specsHeading}</h4>
            <p className="text-xs text-muted-foreground">
              {hasModelSelected ? labels.specsModelHint : labels.specsNoModelHint}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{renderSpecFields(specFields)}</div>
        </div>
      ) : null}

      {showSensors ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormikMultiSelectDropdownField
            name="sensorKeys"
            label={labels.sensorsLabel}
            hint={labels.sensorsHint}
            options={sensorOptions}
            ariaLabel={labels.sensorsLabel}
            placeholder={labels.multiSelectPlaceholder}
            emptyMessage={labels.multiSelectEmptyMessage}
            testId="listing-sensors"
          />
        </div>
      ) : null}
    </div>
  );
}
