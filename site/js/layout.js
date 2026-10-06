// Pure helpers shared by the renderer and the tests: year formatting, lane packing, ruler ticks, search.

/** Astronomical year (1 BCE = 0) to a display string. */
export function formatYear(year) {
  return year <= 0 ? `${1 - year} BCE` : `${year} CE`;
}

/** Display a life span, collapsing a shared era: "1040–970 BCE", "4 BCE – 30 CE". */
export function formatSpan(start, end) {
  if (start <= 0 && end <= 0) return `${1 - start}–${1 - end} BCE`;
  if (start > 0 && end > 0) return `${start}–${end} CE`;
  return `${formatYear(start)} – ${formatYear(end)}`;
}

/**
 * Greedy interval packing. `items` must be sorted by start. Returns lane index per item and lane count.
 * `gap` is the minimum distance (in years) kept between neighbours in one lane.
 */
export function packLanes(items, gap = 2) {
  const laneEnds = [];
  const lanes = new Int32Array(items.length);
  for (let i = 0; i < items.length; i++) {
    const { start, end } = items[i];
    let lane = -1;
    for (let l = 0; l < laneEnds.length; l++) {
      if (laneEnds[l] + gap <= start) { lane = l; break; }
    }
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(end); } else laneEnds[lane] = end;
    lanes[i] = lane;
  }
  return { lanes, count: laneEnds.length };
}

const TICK_STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];

/** Ruler ticks for a visible window so labels sit at least `minPx` apart. Ticks are civil years (no year 0). */
export function rulerTicks(startYear, endYear, pxPerYear, minPx = 90) {
  const step = TICK_STEPS.find((s) => s * pxPerYear >= minPx) ?? 1000;
  // Work in civil numbering so BCE ticks land on round numbers (1000 BCE = astronomical -999).
  const ticks = [];
  const civil = (y) => (y <= 0 ? y - 1 : y); // astronomical -> signed civil
  const astro = (c) => (c < 0 ? c + 1 : c);
  let c = Math.floor(civil(startYear) / step) * step;
  for (; astro(c) <= endYear + step; c += step) {
    if (c === 0) continue; // no year zero
    ticks.push({ year: astro(c), label: c < 0 ? `${-c} BCE` : `${c} CE`, major: c % (step * 5) === 0 });
  }
  return { step, ticks };
}

/** Fold diacritics and case so "Ἰησοῦς", "Hosea", "hoshea" compare loosely. */
export function fold(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Rank people for a query: exact name, prefix, word prefix, alias, description. Returns indices. */
export function searchPeople(people, query, limit = 30) {
  const q = fold(query.trim());
  if (!q) return [];
  const scored = [];
  for (let i = 0; i < people.length; i++) {
    const p = people[i];
    const name = p.fold;
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.split(/[\s-]+/).some((w) => w.startsWith(q))) score = 60;
    else if (p.aliasFold.some((a) => a.startsWith(q))) score = 50;
    else if (q.length >= 4 && p.descFold.includes(q)) score = 20;
    if (score) scored.push([score + Math.min(10, p.books.size), i]);
  }
  scored.sort((a, b) => b[0] - a[0] || people[a[1]].start - people[b[1]].start);
  return scored.slice(0, limit).map((s) => s[1]);
}

/** Index of the first element whose `key(el)` >= value in an array sorted by key. */
export function lowerBound(array, value, key) {
  let lo = 0;
  let hi = array.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (key(array[mid]) < value) lo = mid + 1; else hi = mid;
  }
  return lo;
}

/** Robust extent of a set of spans (drops the outer 5% on each side when there are many). */
export function focusExtent(spans) {
  if (!spans.length) return null;
  const starts = spans.map((s) => s[0]).sort((a, b) => a - b);
  const ends = spans.map((s) => s[1]).sort((a, b) => a - b);
  const trim = spans.length >= 20 ? Math.floor(spans.length * 0.05) : 0;
  return [starts[trim], ends[ends.length - 1 - trim]];
}
