// The Revelation, chapters 1 to 22, as an ordered list of scenes on one scroll axis, seen through the eyes
// of John on Patmos. Scripture is quoted from the King James Version (as in the Journey, story.js); tests
// check every caption against the KJV text. Each scene says which verses it shows (`covers`), and tests
// check that every verse of the chapters built so far is shown, in order. There are no years: the whole
// vision is one moment, about AD 95.

import { envelope, layout } from "../storyline.js";

export const UNIT_VH = 18;

/** Verses in each chapter of Revelation (KJV), chapter 1 first: 404 in all. */
export const CHAPTER_VERSES = [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21];

/** Chapters built so far: tests require every verse of chapters 1..BUILT to be shown by some scene. */
export const BUILT = 0;

/** "4:1-3" -> ["4:1", "4:2", "4:3"]; "1:9" -> ["1:9"]; "2-3" or "5" (whole chapters) -> every verse in them. */
export function versesOf(range) {
  const m = range.match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (m) {
    const [c, a, b = a] = m.slice(1).filter(Boolean).map(Number);
    return Array.from({ length: b - a + 1 }, (_, i) => `${c}:${a + i}`);
  }
  const [a, b = a] = range.split("-").map(Number);
  const out = [];
  for (let c = a; c <= b; c++) for (let n = 1; n <= CHAPTER_VERSES[c - 1]; n++) out.push(`${c}:${n}`);
  return out;
}

const L = { light: [1, 0.97, 0.9], dark: [0, 0, 0], night: [0.02, 0.03, 0.05], gold: [0.95, 0.78, 0.45] };
const t = (kind, width = 2) => ({ kind: kind === "cloud" ? "cloud" : "fade", color: L[kind] ?? L.dark, width });

// caption helpers: v = verse, h = monumental title, n = note (no scripture)
const v = (from, to, text, ref, kicker) => ({ from, to, style: "verse", text, ref, kicker });
const h = (from, to, text, ref, note) => ({ from, to, style: "title", text, ref, note });

export const SCENES = [
  // ---------------------------------------------------------------- Prologue (1:1–8)
  {
    id: "prologue", module: "prologue", length: 28, enter: null, years: null, covers: ["1:1-8"], creatures: [],
    acts: [{ label: "Prologue", title: "The Revelation of Jesus Christ", at: 0 }],
    captions: [
      h(2, 6, "The Revelation of Jesus Christ", "Revelation 1:1"),
      v(6.5, 10.5, "he sent and signified it by his angel unto his servant John", "Revelation 1:1"),
      v(11, 14.5, "Blessed is he that readeth, and they that hear the words of this prophecy", "Revelation 1:3"),
      v(15, 19, "Grace be unto you, and peace, from him which is, and which was, and which is to come; and from the seven Spirits which are before his throne", "Revelation 1:4"),
      v(19.5, 23, "Behold, he cometh with clouds; and every eye shall see him", "Revelation 1:7"),
      h(23.5, 27.3, "I am Alpha and Omega, the beginning and the ending", "Revelation 1:8"),
    ],
  },
];

export const { LENGTH, ACTS, CAPTIONS, TRANSITIONS, locate, yearAt } = layout(SCENES);
export { envelope };
