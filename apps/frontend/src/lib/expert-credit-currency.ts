/** Format Stripe-style minor units (cents) for display. */
export function formatCurrencyFromMinorUnits(amountCents: string | number, currencyKey: string): string {
  const minor = Number(amountCents);
  if (!Number.isFinite(minor)) {
    return String(amountCents);
  }
  const major = minor / 100;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyKey.toUpperCase() }).format(major);
}

/** Map stored cents to a major-unit string for form inputs (e.g. 10000 → "100"). */
export function minorUnitsToMajorInput(amountCents: string | number): string {
  const minor = Number(amountCents);
  if (!Number.isFinite(minor)) {
    return '';
  }
  const major = minor / 100;
  return Number.isInteger(major) ? String(major) : major.toFixed(2).replace(/\.?0+$/, '');
}

/** Parse a major-unit price string into integer cents for API payloads. */
export function majorUnitsToMinorUnits(major: string): number {
  const normalized = major.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return Number.NaN;
  }
  return Math.round(Number(normalized) * 100);
}
