// The Revelation, chapters 1 to 22, as an ordered list of scenes on one scroll axis, seen through the eyes
// of John on Patmos. Scripture is quoted from the King James Version (as in the Journey, story.js); tests
// check every caption against the KJV text. Each scene says which verses it shows (`covers`), and tests
// check that every verse of the chapters built so far is shown, in order. There are no years: the whole
// vision is one moment, about AD 95.

import { envelope, layout } from "../storyline.js";

export const UNIT_VH = 18;

const L = { light: [1, 0.97, 0.9], dark: [0, 0, 0], night: [0.02, 0.03, 0.05], gold: [0.95, 0.78, 0.45] };
const t = (kind, width = 2) => ({ kind: kind === "cloud" ? "cloud" : "fade", color: L[kind] ?? L.dark, width });

// caption helpers: v = verse, h = monumental title, n = note (no scripture)
const v = (from, to, text, ref, kicker) => ({ from, to, style: "verse", text, ref, kicker });
const h = (from, to, text, ref, note) => ({ from, to, style: "title", text, ref, note });

export const SCENES = [
  // ---------------------------------------------------------------- Prologue (1:1–8)
  {
    id: "prologue", module: "prologue", length: 22, enter: null, years: null, covers: [], creatures: [],
    acts: [{ label: "Prologue", title: "The Revelation of Jesus Christ", at: 0 }],
    captions: [
      h(3, 9, "The Revelation of Jesus Christ", "Revelation 1:1"),
    ],
  },
];

export const { LENGTH, ACTS, CAPTIONS, TRANSITIONS, locate, yearAt } = layout(SCENES);
export { envelope };
