// Revelation 1:1–8 — the title sequence: a dark sea at night, before the island comes into view.

import { createLandscape } from "../../kit/landscape.js";

export function create(ctx) {
  return createLandscape(ctx, {
    water: { size: 3000, wave: 0.6, chop: 1.2, deep: [0.01, 0.03, 0.05], level: 0 },
    sky: () => [[1, "night"]],
    camera: [[0, [0, 12, 160], [0, 8, 0], 46], [22, [0, 10, 120], [0, 8, 0], 46]],
    grade: () => ({ bloom: 0.4, threshold: 0.75, exposure: 0.8 }),
    audio: () => ({ water: 0.5, wind: 0.3, drone: 0.25 }),
  });
}
