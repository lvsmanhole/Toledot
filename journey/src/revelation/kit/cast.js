// The cast of the vision: cast("lamb", 0.9) is the approved model of a creature, or its stand-in, at a height.

import { creature } from "./creature.js";
import { STANDINS } from "./standins.js";

export function cast(key, height) {
  return creature(key, { height, standIn: STANDINS[key] });
}
