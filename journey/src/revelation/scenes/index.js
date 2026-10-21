// Scene modules of the Revelation, loaded on demand like the Journey's (see ../../scenes/index.js).

export const MODULES = {
  prologue: () => import("./prologue.js").then((m) => m.create),
  patmos: () => import("./patmos.js").then((m) => m.create),
  sonofman: () => import("./sonofman.js").then((m) => m.create),
  maps: () => import("../../scenes/maps.js").then((m) => m.create),
  churches: () => import("./churches.js").then((m) => m.create),
  door: () => import("./door.js").then((m) => m.create),
  lamb: () => import("./lamb.js").then((m) => m.create),
  horsemen: () => import("./horsemen.js").then((m) => m.create),
  altar: () => import("./altar.js").then((m) => m.create),
  sixthseal: () => import("./sixthseal.js").then((m) => m.create),
  sealing: () => import("./sealing.js").then((m) => m.create),
  multitude: () => import("./multitude.js").then((m) => m.create),
  censer: () => import("./censer.js").then((m) => m.create),
  trumpets: () => import("./trumpets.js").then((m) => m.create),
  pit: () => import("./pit.js").then((m) => m.create),
  euphrates: () => import("./euphrates.js").then((m) => m.create),
  littlebook: () => import("./littlebook.js").then((m) => m.create),
  witnesses: () => import("./witnesses.js").then((m) => m.create),
  seventh: () => import("./seventh.js").then((m) => m.create),
};
