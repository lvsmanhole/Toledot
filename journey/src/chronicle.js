// The Chronicle: the Toledot timeline brought into the journey. A ribbon along the bottom of the screen
// shows the people of the current scene's chapters alive around the story's year (dashed where the
// lifespan is an editorial estimate, solid where it is anchored in dated text, gold for the line of
// promise), events from those chapters, and a playhead at the current year. Data: site/data/core.json.

const fmt = (y) => {
  const r = Math.round(y);
  return r <= 0 ? `${1 - r} BCE` : `${r} CE`;
};
const span = (a, b) => (a <= 0 && b <= 0 ? `${1 - a}–${1 - b} BCE` : a > 0 && b > 0 ? `${a}–${b} CE` : `${fmt(a)} – ${fmt(b)}`);

export class Chronicle {
  constructor(root) {
    this.root = root;
    this.canvas = root.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.yearEl = root.querySelector(".chr-year");
    this.eraEl = root.querySelector(".chr-era");
    this.card = root.querySelector(".chr-card");
    this.tip = root.querySelector(".chr-tip");
    this.data = null;
    this.selection = null;
    this.sceneId = null;
    this.year = null;
    this.hits = [];
    this.dirty = true;
    this.lastDraw = 0;
    this.canvas.addEventListener("pointermove", (e) => this.hover(e));
    this.canvas.addEventListener("pointerleave", () => { this.tip.hidden = true; });
    this.canvas.addEventListener("click", (e) => this.click(e));
    root.querySelector(".chr-card-close").addEventListener("click", () => { this.card.hidden = true; });
    new ResizeObserver(() => { this.dirty = true; }).observe(this.canvas);
  }

  async load(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);
      const core = await res.json();
      const people = core.people.map(([id, name, start, end, grade, basis, gender, cls, aliases, description], index) =>
        ({ index, id, name, start, end, grade, description, cls, gender }));
      const byId = new Map(people.map((p) => [p.id, p]));
      // the line of promise: everyone the data lists as an ancestor of Jesus
      const parentsOf = new Map();
      for (const [parent, child] of core.parents) {
        if (!parentsOf.has(child)) parentsOf.set(child, []);
        parentsOf.get(child).push(parent);
      }
      // the line of promise: everyone Matthew 1 names, and their fathers back to Adam
      const books = new Map(core.books.map((b) => [b.id, b]));
      const lineage = new Set();
      // (Uriah is named in Matthew 1:6 only as Bathsheba's former husband)
      const stack = [...(books.get("matthew")?.chapters[0]?.people ?? [])].filter((i) => !/^Uri(ah|as)$/.test(people[i].name));
      while (stack.length) {
        const i = stack.pop();
        if (lineage.has(i)) continue;
        lineage.add(i);
        for (const p of parentsOf.get(i) ?? []) if (people[p].gender === "m") stack.push(p);
      }
      const events = core.events;
      this.data = { people, byId, lineage, books, events, eventById: new Map(events.map((e) => [e.id, e])) };
      this.root.classList.add("is-ready");
      return true;
    } catch (error) {
      console.warn("Chronicle data unavailable:", error);
      this.root.classList.add("is-unavailable");
      return false;
    }
  }

  /** Pick people and events for a scene from its chronicle spec. */
  select(scene) {
    if (!this.data || this.sceneId === scene.id) return;
    this.sceneId = scene.id;
    this.dirty = true;
    const spec = scene.chronicle;
    if (!spec) { this.selection = null; return; }
    const counts = new Map();
    const eventIds = new Set();
    for (const ref of spec.chapters) {
      const [bookId, range = ""] = ref.split(":");
      const book = this.data.books.get(bookId);
      if (!book) continue;
      const [a, b] = range ? range.split("-").map(Number) : [1, 999];
      for (const ch of book.chapters) {
        const num = parseInt(ch.n ?? "1", 10);
        if (num < a || num > (b ?? a)) continue;
        for (const p of ch.people) counts.set(p, (counts.get(p) ?? 0) + 1);
        for (const e of ch.events) eventIds.add(e);
      }
    }
    let chosen = [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, spec.max ?? 28).map(([i]) => this.data.people[i]);
    if (spec.kings) {
      const kings = this.data.people.filter((p) => /\bking of (israel|judah)\b/i.test(p.description));
      chosen = [...new Set([...kings, ...chosen.slice(0, 10)])];
    }
    chosen.sort((x, y) => x.start - y.start);
    const events = [...eventIds].map((id) => this.data.eventById.get(id)).filter((e) => e && e.year !== null);
    this.selection = { people: chosen, events, span: spec.span ?? 200, gospels: Boolean(spec.gospels), kings: Boolean(spec.kings) };
  }

  setYear(year, label) {
    if (year === this.year && label === this.label) return;
    if (year !== null && this.year !== null && Math.abs(year - this.year) < 0.02 && label === this.label) return;
    this.year = year;
    this.label = label;
    this.dirty = true;
    if (year === null) {
      this.yearEl.textContent = label ?? "";
      this.eraEl.textContent = "";
    } else {
      this.yearEl.textContent = `c. ${fmt(year)}`;
      this.eraEl.textContent = label ?? "Toledot chronology";
    }
  }

  draw(now) {
    if (!this.dirty || now - this.lastDraw < 50) return;
    this.dirty = false;
    this.lastDraw = now;
    const { canvas, ctx } = this;
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const hgt = canvas.clientHeight;
    if (!w) return;
    if (canvas.width !== Math.round(w * ratio)) {
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(hgt * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, hgt);
    this.hits = [];
    const sel = this.selection;
    const show = Boolean(sel && this.year !== null);
    this.root.classList.toggle("has-ribbon", show);
    if (!show) return;
    const half = sel.span / 2;
    const y0 = this.year - half;
    const y1 = this.year + half;
    const x = (y) => ((y - y0) / (y1 - y0)) * w;
    // ticks
    const step = [5, 10, 25, 50, 100, 250, 500].find((s) => (s / (y1 - y0)) * w > 70) ?? 1000;
    ctx.font = "500 10px 'Instrument Sans', system-ui, sans-serif";
    ctx.textBaseline = "top";
    for (let c = Math.ceil(y0 / step) * step; c <= y1; c += step) {
      const px = Math.round(x(c)) + 0.5;
      ctx.fillStyle = "rgba(239,230,210,0.10)";
      ctx.fillRect(px, 0, 1, hgt);
      ctx.fillStyle = "rgba(239,230,210,0.38)";
      ctx.fillText(fmt(c).replace(" BCE", " BC").replace(" CE", " AD"), px + 3, hgt - 13);
    }
    // people lanes
    const lanes = [];
    const rowH = 15;
    const maxLanes = Math.floor((hgt - 18) / rowH);
    ctx.textBaseline = "alphabetic";
    for (const p of sel.people) {
      if (p.end < y0 || p.start > y1) continue;
      const xs = Math.max(x(p.start), -2);
      const xe = Math.min(x(p.end + 1), w + 2);
      ctx.font = "500 11px 'Instrument Sans', system-ui, sans-serif";
      const labelW = ctx.measureText(p.name).width + 8;
      let lane = lanes.findIndex((end) => end < xs - 4);
      if (lane === -1) {
        if (lanes.length >= maxLanes) continue;
        lane = lanes.length;
        lanes.push(0);
      }
      lanes[lane] = Math.max(xe, xs + labelW);
      const yy = 4 + lane * rowH;
      const gold = this.data.lineage.has(p.index);
      const alive = this.year >= p.start && this.year <= p.end + 1;
      const color = gold ? "214,173,92" : "239,230,210";
      const alpha = alive ? 0.95 : 0.45;
      ctx.strokeStyle = `rgba(${color},${alpha})`;
      ctx.lineWidth = gold ? 2.2 : 1.5;
      if (p.grade === "E") ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xs, yy + 10.5);
      ctx.lineTo(xe, yy + 10.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${color},${alive ? 1 : 0.55})`;
      ctx.fillText(p.name, Math.max(xs, 2), yy + 8);
      this.hits.push({ kind: "person", item: p, x0: Math.max(xs, 0), x1: Math.max(xe, xs + labelW), y0: yy, y1: yy + rowH });
    }
    // events
    for (const e of sel.events) {
      if (e.year < y0 || e.year > y1) continue;
      const px = x(e.year + 0.5);
      const py = hgt - 22;
      ctx.fillStyle = e.basis === "dated_claim" ? "rgba(214,173,92,0.95)" : "rgba(0,0,0,0)";
      ctx.strokeStyle = "rgba(214,173,92,0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px + 4, py);
      ctx.lineTo(px, py + 4);
      ctx.lineTo(px - 4, py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      this.hits.push({ kind: "event", item: e, x0: px - 6, x1: px + 6, y0: py - 6, y1: py + 6 });
    }
    // playhead
    const cx = Math.round(x(this.year)) + 0.5;
    const grad = ctx.createLinearGradient(0, 0, 0, hgt);
    grad.addColorStop(0, "rgba(214,173,92,0)");
    grad.addColorStop(0.5, "rgba(214,173,92,0.9)");
    grad.addColorStop(1, "rgba(214,173,92,0.2)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 0.5, 0, 1.5, hgt);
  }

  hitAt(e) {
    const r = this.canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    return this.hits.find((h) => px >= h.x0 && px <= h.x1 && py >= h.y0 && py <= h.y1);
  }

  hover(e) {
    const hit = this.hitAt(e);
    this.canvas.style.cursor = hit ? "pointer" : "";
    if (!hit) { this.tip.hidden = true; return; }
    const it = hit.item;
    this.tip.textContent = hit.kind === "person"
      ? `${it.name} · ${span(it.start, it.end)}${it.grade === "E" ? " (estimate)" : ""}`
      : `${it.name} · ${it.basis === "dated_claim" ? "" : "c. "}${fmt(it.year)}${it.gospels?.length > 1 ? ` · in ${it.gospels.join(", ")}` : ""}`;
    this.tip.hidden = false;
    const r = this.root.getBoundingClientRect();
    this.tip.style.left = `${Math.min(r.width - 260, Math.max(8, e.clientX - r.left + 12))}px`;
  }

  click(e) {
    const hit = this.hitAt(e);
    if (!hit) return;
    const it = hit.item;
    const card = this.card;
    card.querySelector(".chr-card-kicker").textContent = hit.kind === "person" ? (this.data.lineage.has(it.index) ? "Line of promise" : "Person") : "Event";
    card.querySelector(".chr-card-name").textContent = it.name;
    card.querySelector(".chr-card-dates").textContent = hit.kind === "person"
      ? `${span(it.start, it.end)} · ${it.grade === "E" ? "editorial estimate (grade E)" : `anchored in dated text (grade ${it.grade})`}`
      : `${it.basis === "dated_claim" ? "" : "c. "}${fmt(it.year)} · ${it.basis === "dated_claim" ? "dated" : "placed by its participants"}`;
    card.querySelector(".chr-card-desc").textContent = hit.kind === "person" ? it.description || "" : it.gospels?.length > 1 ? `Told in ${it.gospels.join(", ")}.` : "";
    const link = card.querySelector(".chr-card-link");
    link.href = hit.kind === "person" ? `timeline/#/?p=${encodeURIComponent(it.id)}` : `timeline/#/?e=${encodeURIComponent(it.id)}`;
    card.hidden = false;
  }
}
