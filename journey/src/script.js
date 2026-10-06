// The journey's script: scroll is measured in story units (0..LENGTH). Scenes own contiguous ranges;
// captions are placed on the same axis. Scripture is quoted from the World English Bible (public domain).

export const LENGTH = 100;
export const UNIT_VH = 22; // viewport-height percent of scrolling per story unit

export const SCENES = [
  { id: "cosmos", from: 0, to: 26 },
  { id: "earth", from: 26, to: 50 },
  { id: "eden", from: 50, to: LENGTH },
];

// Transitions between scenes: the grade pass fades through a colour (or through cloud) around `at`.
export const TRANSITIONS = [
  { at: 26, width: 2.2, color: [1, 0.97, 0.9], kind: "light" },  // through the light into the young world
  { at: 50, width: 3.0, color: [0.92, 0.94, 0.97], kind: "cloud" }, // down through the clouds into Eden
];

// Acts shown on the rail. `built: false` acts are listed so the scope of the journey is visible.
export const ACTS = [
  { id: "prologue", label: "Prologue", title: "Before the World", at: 0, built: true },
  { id: "creation", label: "Act I", title: "Creation", at: 16, built: true },
  { id: "eden", label: "Act I", title: "Eden", at: 52, built: true },
  { id: "fall", label: "Act II", title: "The Fall", at: 74, built: true },
  { label: "Act III", title: "Cain, Abel & Early Humanity" },
  { label: "Act IV", title: "The Flood" },
  { label: "Act V", title: "Babel & the Nations" },
  { label: "Act VI", title: "Abraham" },
  { label: "Act VII", title: "Isaac, Jacob & the Twelve" },
  { label: "Act VIII", title: "Joseph & Egypt" },
  { label: "Act IX", title: "Israel in Bondage" },
  { label: "Act X", title: "Moses & the Exodus" },
  { label: "Act XI", title: "Sinai & the Wilderness" },
  { label: "Act XII", title: "Joshua & the Land" },
  { label: "Act XIII", title: "The Judges" },
  { label: "Act XIV", title: "Ruth" },
  { label: "Act XV", title: "Samuel & Saul" },
  { label: "Act XVI", title: "King David" },
  { label: "Act XVII", title: "Solomon & the Temple" },
  { label: "Act XVIII", title: "The Divided Kingdom" },
  { label: "Act XIX", title: "The Prophets" },
  { label: "Act XX", title: "Assyria & the Fall of Israel" },
  { label: "Act XXI", title: "Babylon & the Fall of Jerusalem" },
];

// style: "title" = monumental capitals; "verse" = scripture with reference; "note" = small context line
export const CAPTIONS = [
  { from: 2.5, to: 8, style: "title", text: "In the beginning" },
  { from: 8.5, to: 14, style: "title", text: "God created the heavens and the earth", ref: "Genesis 1:1" },
  { from: 14.5, to: 19.5, style: "verse", text: "The earth was formless and empty. Darkness was on the surface of the deep and God’s Spirit was hovering over the surface of the waters.", ref: "Genesis 1:2" },
  { from: 20, to: 25, style: "title", text: "Let there be light", ref: "Genesis 1:3" },

  { from: 28, to: 32, style: "verse", text: "Let there be an expanse in the middle of the waters, and let it divide the waters from the waters.", ref: "Genesis 1:6", kicker: "The second day" },
  { from: 32.5, to: 36.5, style: "verse", text: "Let the waters under the sky be gathered together to one place, and let the dry land appear.", ref: "Genesis 1:9", kicker: "The third day" },
  { from: 37, to: 40.5, style: "verse", text: "Let the earth yield grass, herbs yielding seeds, and fruit trees bearing fruit after their kind.", ref: "Genesis 1:11" },
  { from: 41, to: 44, style: "verse", text: "Let there be lights in the expanse of the sky to divide the day from the night.", ref: "Genesis 1:14", kicker: "The fourth day" },
  { from: 44.5, to: 48, style: "verse", text: "Let the waters abound with living creatures, and let birds fly above the earth.", ref: "Genesis 1:20", kicker: "The fifth day" },

  { from: 52.5, to: 57, style: "verse", text: "Yahweh God planted a garden eastward, in Eden, and there he put the man whom he had formed.", ref: "Genesis 2:8", kicker: "The garden" },
  { from: 57.5, to: 62, style: "verse", text: "A river went out of Eden to water the garden.", ref: "Genesis 2:10" },
  { from: 62.5, to: 67.5, style: "verse", text: "The tree of life also in the middle of the garden, and the tree of the knowledge of good and evil.", ref: "Genesis 2:9" },
  { from: 68, to: 72.5, style: "verse", text: "God saw everything that he had made, and, behold, it was very good.", ref: "Genesis 1:31" },

  { from: 75, to: 79, style: "verse", text: "Now the serpent was more subtle than any animal of the field which Yahweh God had made.", ref: "Genesis 3:1", kicker: "The Fall" },
  { from: 79.5, to: 84, style: "verse", text: "She took some of its fruit, and ate. Then she gave some to her husband with her, and he ate it.", ref: "Genesis 3:6" },
  { from: 84.5, to: 89, style: "verse", text: "For you are dust, and you shall return to dust.", ref: "Genesis 3:19" },
  { from: 89.5, to: 95, style: "verse", text: "He placed cherubim at the east of the garden of Eden, and a flaming sword which turned every way, to guard the way to the tree of life.", ref: "Genesis 3:24" },
  { from: 95.3, to: 98.6, style: "title", text: "The lineage of promise", note: "Adam: the first strand of a line that runs through Seth, Noah, Abraham and David to Christ.", ref: "Luke 3:23–38" },
];

/** Smooth 0..1 envelope: rises over `fade` units after `from`, falls over `fade` units before `to`. */
export function envelope(u, from, to, fade = 1.2) {
  if (u <= from || u >= to) return 0;
  const a = Math.min(1, (u - from) / fade);
  const b = Math.min(1, (to - u) / fade);
  const x = Math.min(a, b);
  return x * x * (3 - 2 * x);
}

/** Which scene is active, its local 0..1 time, and the transition overlay at story unit `u`. */
export function locate(u) {
  const scene = SCENES.find((s) => u >= s.from && u < s.to) ?? SCENES[SCENES.length - 1];
  const local = Math.min(1, Math.max(0, (u - scene.from) / (scene.to - scene.from)));
  let fade = 0;
  let transition = null;
  for (const t of TRANSITIONS) {
    const d = Math.abs(u - t.at);
    if (d < t.width) {
      const x = 1 - d / t.width;
      const v = x * x * (3 - 2 * x);
      if (v > fade) { fade = v; transition = t; }
    }
  }
  return { scene, local, fade, transition };
}
