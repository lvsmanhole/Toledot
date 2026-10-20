// Scene modules of the Revelation, loaded on demand like the Journey's (see ../../scenes/index.js).

export const MODULES = {
  prologue: () => import("./prologue.js").then((m) => m.create),
  patmos: () => import("./patmos.js").then((m) => m.create),
  sonofman: () => import("./sonofman.js").then((m) => m.create),
  maps: () => import("../../scenes/maps.js").then((m) => m.create),
  churches: () => import("./churches.js").then((m) => m.create),
  door: () => import("./door.js").then((m) => m.create),
  lamb: () => import("./lamb.js").then((m) => m.create),
};
