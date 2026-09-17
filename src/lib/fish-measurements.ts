export type FishStatSample = {
  sizeCm: number;
  stats: Record<string, number>;
};

/** Always calculate from the original catch, never from rounded maximums. */
export function fishStatMaximum(
  stat: string,
  bestSizeCm: number | null | undefined,
  sample: FishStatSample | null | undefined,
  percentage = false,
): number | null {
  const value = sample?.stats[stat];
  if (
    !sample ||
    !Number.isFinite(sample.sizeCm) ||
    sample.sizeCm <= 0 ||
    bestSizeCm == null ||
    !Number.isFinite(bestSizeCm) ||
    bestSizeCm <= 0 ||
    value == null ||
    !Number.isFinite(value) ||
    value < 0
  )
    return null;
  const maximum = (value / sample.sizeCm) * bestSizeCm;
  if (!Number.isFinite(maximum)) return null;
  // Presentation convention: whole base stats and two-decimal percentages.
  return Number(maximum.toFixed(percentage ? 2 : 0));
}
