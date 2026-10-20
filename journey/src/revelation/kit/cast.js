// The cast of the vision: cast("lamb", 0.9) is the approved model of a creature, or its stand-in, at a height
// (cast("wingEyes", 0.9, { root: "minX" }) places it by its left edge rather than its middle).

import { creature } from "./creature.js";
import { STANDINS } from "./standins.js";

export function cast(key, height, opts = {}) {
  return creature(key, { height, standIn: STANDINS[key], ...opts });
}
