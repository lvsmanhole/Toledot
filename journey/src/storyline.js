// The layout of a story on its scroll axis: where each scene, act, caption and transition falls, and the
// lookups the director runs every frame. Shared by the Journey (story.js) and the Revelation.

/** Smooth 0..1 envelope: rises over `fade` units after `from`, falls over `fade` units before `to`. */
export function envelope(u, from, to, fade = 1.2) {
  if (u <= from || u >= to) return 0;
  const a = Math.min(1, (u - from) / fade);
  const b = Math.min(1, (to - u) / fade);
  const x = Math.min(a, b);
  return x * x * (3 - 2 * x);
}

/** Lay scenes end to end (sets each scene's from/to) and derive acts, captions, transitions and lookups. */
export function layout(SCENES) {
  let offset = 0;
  for (const s of SCENES) {
    s.from = offset;
    s.to = offset + s.length;
    offset = s.to;
  }
  const LENGTH = offset;

  const ACTS = SCENES.flatMap((s) => (s.acts ?? []).map((a) => ({ ...a, scene: s.id, at: s.from + a.at, built: true })));

  const CAPTIONS = SCENES.flatMap((s) => (s.captions ?? []).map((c) => ({ ...c, scene: s.id, from: s.from + c.from, to: s.from + c.to })));

  const TRANSITIONS = SCENES.filter((s) => s.enter).map((s) => ({ at: s.from, ...s.enter }));

  /** Active scene index, its local units, and the transition overlay at story unit `u`. */
  function locate(u) {
    let i = SCENES.findIndex((s) => u >= s.from && u < s.to);
    if (i < 0) i = u < 0 ? 0 : SCENES.length - 1;
    const scene = SCENES[i];
    const rel = Math.min(scene.length, Math.max(0, u - scene.from));
    let fade = 0;
    let transition = null;
    for (const tr of TRANSITIONS) {
      const d = Math.abs(u - tr.at);
      if (d < tr.width) {
        const x = 1 - d / tr.width;
        const val = x * x * (3 - 2 * x);
        if (val > fade) { fade = val; transition = tr; }
      }
    }
    return { index: i, scene, rel, local: rel / scene.length, fade, transition };
  }

  /** Story year (astronomical) at unit u, or null before time began / beyond it. */
  function yearAt(u) {
    const { scene, rel } = locate(u);
    if (!scene.years) return null;
    const ys = scene.years;
    if (rel <= ys[0][0]) return ys[0][1];
    for (let i = 0; i < ys.length - 1; i++) {
      const [a, ya] = ys[i];
      const [b, yb] = ys[i + 1];
      if (rel <= b) return ya + ((yb - ya) * (rel - a)) / (b - a);
    }
    return ys[ys.length - 1][1];
  }

  return { SCENES, LENGTH, ACTS, CAPTIONS, TRANSITIONS, locate, yearAt };
}
