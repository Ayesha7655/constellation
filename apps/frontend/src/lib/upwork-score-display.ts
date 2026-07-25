/** Backend scores/weights are 0–100; UI shows them on a 0–10 scale. */
export function scaleUpworkScoreToTen(value: number): number {
  return Math.round((value / 10) * 10) / 10;
}

export function formatUpworkScoreOutOfTen(value: number): string {
  const scaled = scaleUpworkScoreToTen(value);
  return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
}

/** Contribution ÷ weight as a unit ratio (e.g. 1/4 → 0.25). */
export function formatUpworkBreakdownPart(contribution: number, weight: number): string {
  if (weight <= 0) return '0';
  const ratio = contribution / weight;
  const rounded = Math.round(ratio * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
