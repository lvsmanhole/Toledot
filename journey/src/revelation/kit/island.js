// Patmos: a rocky island in a dark sea (Revelation 1:9), shared by the scenes set on it. John stands on a
// ledge above the shore at JOHN, looking east over the water; the voice comes from behind him (the west).

import { createLandscape } from "../../kit/landscape.js";
import { composeHeight, heights } from "../../kit/terrain.js";

export const JOHN = [2, 2]; // where John stands (x, z)

export function patmos(ctx, options) {
  const island = (x, z) => 30 * Math.exp(-(x * x + z * z) / 9000) - 6;
  const height = composeHeight([island, heights.rolling(6, 0.03, 381)], 0);
  return createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 900 },
    water: { size: 3000, wave: 0.6, chop: 1.2, deep: [0.01, 0.03, 0.05], level: 0 },
    keepClear: [[JOHN[0], JOHN[1], 12], [-14, 2, 16]],
    ...options,
  });
}
