// How much of each scattered thing a device can afford (crowds, grass, houses, herds, rocks). Desktop
// draws everything; phones and tablets draw a share, set once at start by the director.

export const budget = { density: 1 };

/** Scale a count by the device budget; small counts (named people, a few props) are kept whole. */
export function scaled(count, keep = 40) {
  if (budget.density >= 1 || count <= keep) return count;
  return Math.max(keep, Math.round(count * budget.density));
}
