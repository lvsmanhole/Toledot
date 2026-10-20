// Scene modules of the Revelation, loaded on demand like the Journey's (see ../../scenes/index.js).

export const MODULES = {
  prologue: () => import("./prologue.js").then((m) => m.create),
  patmos: () => import("./patmos.js").then((m) => m.create),
};
