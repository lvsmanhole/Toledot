// Patmos: a rocky island in a dark sea (Revelation 1:9), shared by the scenes set on it. John stands on a
// ledge of the eastern slope at JOHN, looking east (+x) over the water; the voice comes from behind him.

import { createLandscape } from "../../kit/landscape.js";
import { composeHeight, heights } from "../../kit/terrain.js";

const ROCK = { low: [0.3, 0.27, 0.22], high: [0.34, 0.31, 0.27], rock: [0.33, 0.3, 0.27], snow: [0.33, 0.3, 0.27], wet: [0.18, 0.16, 0.13], snowLine: 999 };

export const JOHN = [70, 0]; // where John stands (x, z)

/** Height of the island's ground at (x, z). */
export const islandHeight = composeHeight([heights.mountain(0, 0, 170, 52, 23, 1.2), heights.rolling(5, 0.035, 381), (x, z) => -9], 0);

/** Height of the ground where John stands. */
export const groundAtJohn = islandHeight(JOHN[0], JOHN[1]);

export function patmos(ctx, options) {
  return createLandscape(ctx, {
    // grey-brown volcanic rock with thin scrub
    terrain: { height: islandHeight, palette: ROCK, size: 900, highFrom: 2, highSpan: 18 },
    water: { size: 3000, wave: 0.6, chop: 1.2, deep: [0.01, 0.03, 0.05], level: 0 },
    keepClear: [[JOHN[0], JOHN[1], 8], [JOHN[0] - 26, JOHN[1], 14]],
    rocks: 160,
    ...options,
  });
}
