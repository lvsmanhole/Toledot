// Canvas timeline: year ruler, event track, and packed life lines. Pan/zoom by pointer, wheel, touch, keyboard.

import { formatSpan, formatYear, lowerBound, packLanes, rulerTicks } from "./layout.js";

const RULER_H = 30;
const EVENT_ROW_H = 18;
const EVENT_ROWS = 3;
const TRACK_TOP = RULER_H + EVENT_ROWS * EVENT_ROW_H + 10;
const ROW_H = 26;
const MIN_YEAR = -5700;
const MAX_YEAR = 300;
const MAX_PX_PER_YEAR = 80;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class Timeline {
  constructor(canvas, { onSelectPerson, onSelectEvent, onHover, announce }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onSelectPerson = onSelectPerson;
    this.onSelectEvent = onSelectEvent;
    this.onHover = onHover;
    this.announce = announce;
    this.people = [];
    this.items = [];
    this.laneItems = [];
    this.events = [];
    this.eventHits = [];
    this.viewStart = -4200;
    this.pxPerYear = 0.2;
    this.scrollY = 0;
    this.selected = null;
    this.selectedEvent = null;
    this.focusItem = null;
    this.hoverItem = null;
    this.family = null;
    this.width = 0;
    this.height = 0;
    this.frame = 0;
    this.animation = null;
    this.readTheme();
    this.bindInput();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  // ---------------------------------------------------------------- data
  setPeople(people) {
    const sorted = [...people].sort((a, b) => a.start - b.start || a.end - b.end || a.index - b.index);
    const { lanes, count } = packLanes(sorted, 3);
    this.laneItems = Array.from({ length: count }, () => []);
    this.items = sorted.map((person, i) => {
      const item = { person, lane: lanes[i], next: Infinity };
      this.laneItems[item.lane].push(item);
      return item;
    });
    for (const lane of this.laneItems) {
      for (let i = 0; i < lane.length - 1; i++) lane[i].next = lane[i + 1].person.start;
    }
    this.itemOf = new Map(this.items.map((item) => [item.person.index, item]));
    if (this.focusItem && !this.itemOf.has(this.focusItem.person.index)) this.focusItem = null;
    this.scrollY = Math.min(this.scrollY, this.maxScroll());
    this.request();
  }

  setEvents(events) {
    this.events = events.filter((e) => e.year !== null).sort((a, b) => a.year - b.year);
    this.request();
  }

  setSelection(person, family) {
    this.selected = person;
    this.family = family;
    this.request();
  }

  setSelectedEvent(event) {
    this.selectedEvent = event;
    this.request();
  }

  // ---------------------------------------------------------------- geometry
  x(year) { return (year - this.viewStart) * this.pxPerYear; }
  yearAt(x) { return this.viewStart + x / this.pxPerYear; }
  laneTop(lane) { return TRACK_TOP + lane * ROW_H - this.scrollY; }
  maxScroll() { return Math.max(0, this.laneItems.length * ROW_H + TRACK_TOP + 40 - this.height); }
  minPx() { return this.width / (MAX_YEAR - MIN_YEAR); }

  clampView() {
    this.pxPerYear = Math.min(MAX_PX_PER_YEAR, Math.max(this.minPx(), this.pxPerYear));
    const span = this.width / this.pxPerYear;
    this.viewStart = Math.min(MAX_YEAR - span, Math.max(MIN_YEAR, this.viewStart));
    this.scrollY = Math.min(this.maxScroll(), Math.max(0, this.scrollY));
  }

  visibleRange() { return [this.viewStart, this.yearAt(this.width)]; }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = window.devicePixelRatio || 1;
    const first = this.width === 0;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * ratio);
    this.canvas.height = Math.round(rect.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (first) this.fit(-4200, 100, { animate: false });
    this.clampView();
    this.request();
  }

  readTheme() {
    const css = getComputedStyle(document.documentElement);
    const v = (name) => css.getPropertyValue(name).trim();
    this.theme = {
      bg: v("--canvas"), ink: v("--ink"), soft: v("--ink-soft"), faint: v("--ink-faint"), rule: v("--rule"),
      rubric: v("--rubric"), lapis: v("--lapis"), gold: v("--gold"), panel: v("--paper"),
      ui: v("--font-ui") || "sans-serif", display: v("--font-display") || "serif",
    };
    this.request();
  }

  // ---------------------------------------------------------------- view changes
  fit(start, end, { animate = true, lane = null } = {}) {
    const pad = Math.max(4, (end - start) * 0.08);
    const px = Math.min(MAX_PX_PER_YEAR, Math.max(this.minPx(), this.width / (end - start + 2 * pad)));
    const span = this.width / px;
    const target = { viewStart: (start + end) / 2 - span / 2, pxPerYear: px, scrollY: this.scrollY };
    if (lane !== null) target.scrollY = Math.max(0, TRACK_TOP + lane * ROW_H - this.height / 2);
    this.animateTo(target, animate);
  }

  fitAll() {
    if (!this.items.length) return this.fit(-4200, 100);
    let lo = Infinity;
    let hi = -Infinity;
    for (const { person } of this.items) { lo = Math.min(lo, person.start); hi = Math.max(hi, person.end); }
    this.scrollY = 0;
    this.fit(lo, hi);
  }

  reveal(person, { zoom = true } = {}) {
    const item = this.itemOf?.get(person.index);
    if (!item) return;
    const span = person.end - person.start;
    if (zoom) this.fit(person.start - span * 2, person.end + span * 2, { lane: item.lane });
    else this.fit(this.viewStart, this.yearAt(this.width), { lane: item.lane });
  }

  animateTo(target, animate = true) {
    cancelAnimationFrame(this.animation);
    if (!animate || reducedMotion()) {
      Object.assign(this, target);
      this.clampView();
      this.request();
      return;
    }
    const from = { viewStart: this.viewStart, pxPerYear: this.pxPerYear, scrollY: this.scrollY };
    // interpolate the visible centre and log-scale so zooms feel even
    const centre = (s) => s.viewStart + this.width / s.pxPerYear / 2;
    const c0 = centre(from);
    const c1 = centre(target);
    const z0 = Math.log(from.pxPerYear);
    const z1 = Math.log(target.pxPerYear);
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 450);
      const e = 1 - (1 - t) ** 3;
      this.pxPerYear = Math.exp(z0 + (z1 - z0) * e);
      this.viewStart = c0 + (c1 - c0) * e - this.width / this.pxPerYear / 2;
      this.scrollY = from.scrollY + (target.scrollY - from.scrollY) * e;
      this.clampView();
      this.draw();
      if (t < 1) this.animation = requestAnimationFrame(step);
    };
    this.animation = requestAnimationFrame(step);
  }

  zoomAt(factor, x) {
    const year = this.yearAt(x);
    this.pxPerYear *= factor;
    this.clampView();
    this.viewStart = year - x / this.pxPerYear;
    this.clampView();
    this.request();
  }

  pan(dx, dy) {
    this.viewStart -= dx / this.pxPerYear;
    this.scrollY -= dy;
    this.clampView();
    this.request();
  }

  // ---------------------------------------------------------------- hit testing
  itemAt(x, y) {
    if (y < TRACK_TOP - 4) return null;
    const lane = Math.floor((y + this.scrollY - TRACK_TOP) / ROW_H);
    const items = this.laneItems[lane];
    if (!items) return null;
    const year = this.yearAt(x);
    const slack = 4 / this.pxPerYear;
    let i = lowerBound(items, year - slack, (it) => it.person.end);
    if (i < items.length && items[i].person.start <= year + slack) return items[i];
    // allow clicking the label that trails a short bar
    i = lowerBound(items, year, (it) => it.person.start) - 1;
    const it = items[i];
    if (it && x <= this.x(it.person.start) + this.labelWidth(it)) return it;
    return null;
  }

  eventAt(x, y) {
    if (y < RULER_H || y >= TRACK_TOP - 6) return null;
    let best = null;
    let bestD = 9;
    for (const hit of this.eventHits) {
      const d = Math.hypot(hit.x - x, hit.y - y);
      if (d < bestD) { best = hit.event; bestD = d; }
    }
    return best;
  }

  labelWidth(item) {
    this.ctx.font = this.labelFont(item);
    return this.ctx.measureText(item.person.name).width + 6;
  }

  labelFont(item) {
    const style = item.person.classification === "named_person" ? "" : "italic ";
    const weight = this.selected === item.person ? 600 : 450;
    return `${style}${weight} 12px ${this.theme.ui}`;
  }

  // ---------------------------------------------------------------- input
  bindInput() {
    const canvas = this.canvas;
    const pointers = new Map();
    let drag = null;
    let pinch = null;

    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (pointers.size === 1) drag = { x: e.offsetX, y: e.offsetY, moved: false };
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), px: this.pxPerYear, cx: (a.x + b.x) / 2 };
        drag = null;
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      const p = pointers.get(e.pointerId);
      if (p) {
        const dx = e.offsetX - p.x;
        const dy = e.offsetY - p.y;
        p.x = e.offsetX;
        p.y = e.offsetY;
        if (pinch && pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const year = this.yearAt(pinch.cx);
          this.pxPerYear = pinch.px * (d / pinch.d);
          this.clampView();
          this.viewStart = year - pinch.cx / this.pxPerYear;
          this.clampView();
          this.request();
          return;
        }
        if (drag) {
          if (Math.abs(e.offsetX - drag.x) + Math.abs(e.offsetY - drag.y) > 4) drag.moved = true;
          if (drag.moved) {
            canvas.classList.add("is-dragging");
            this.pan(dx, dy);
          }
        }
        return;
      }
      this.hover(e.offsetX, e.offsetY, e.clientX, e.clientY);
    });
    const end = (e) => {
      const wasClick = drag && !drag.moved && pointers.size === 1;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      canvas.classList.remove("is-dragging");
      if (wasClick && e.type === "pointerup") this.click(e.offsetX, e.offsetY);
      if (!pointers.size) drag = null;
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("pointerleave", () => { if (!pointers.size) this.hover(-1, -1); });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const scale = e.deltaMode === 1 ? 16 : 1;
      if (e.ctrlKey || e.metaKey) {
        this.zoomAt(Math.exp(-e.deltaY * scale * 0.0025), e.offsetX);
      } else if (e.shiftKey) {
        this.pan(-(e.deltaY + e.deltaX) * scale, 0);
      } else {
        this.pan(-e.deltaX * scale, -e.deltaY * scale);
      }
    }, { passive: false });

    canvas.addEventListener("keydown", (e) => this.key(e));
  }

  hover(x, y, clientX, clientY) {
    const item = x < 0 ? null : this.itemAt(x, y);
    const event = item || x < 0 ? null : this.eventAt(x, y);
    const changed = item !== this.hoverItem || event !== this.hoverEvent;
    this.hoverItem = item;
    this.hoverEvent = event;
    this.canvas.style.cursor = item || event ? "pointer" : "";
    if (changed) this.request();
    this.onHover(item?.person ?? null, event, clientX, clientY);
  }

  click(x, y) {
    const event = this.eventAt(x, y);
    if (event) return this.onSelectEvent(event);
    const item = this.itemAt(x, y);
    if (item) {
      this.focusItem = item;
      this.onSelectPerson(item.person);
    }
  }

  visibleItems() {
    const [y0, y1] = this.visibleRange();
    const firstLane = Math.max(0, Math.floor((this.scrollY) / ROW_H));
    const lastLane = Math.min(this.laneItems.length - 1, Math.ceil((this.scrollY + this.height - TRACK_TOP) / ROW_H));
    const out = [];
    for (let lane = firstLane; lane <= lastLane; lane++) {
      const items = this.laneItems[lane];
      for (let i = lowerBound(items, y0, (it) => it.person.end); i < items.length && items[i].person.start <= y1; i++) out.push(items[i]);
    }
    return out.sort((a, b) => a.person.start - b.person.start || a.lane - b.lane);
  }

  key(e) {
    const step = e.shiftKey ? 240 : 60;
    const handled = () => { e.preventDefault(); e.stopPropagation(); };
    switch (e.key) {
      case "ArrowLeft": this.pan(step, 0); return handled();
      case "ArrowRight": this.pan(-step, 0); return handled();
      case "ArrowUp": this.pan(0, step / 2); return handled();
      case "ArrowDown": this.pan(0, -step / 2); return handled();
      case "+": case "=": this.zoomAt(1.4, this.width / 2); return handled();
      case "-": case "_": this.zoomAt(1 / 1.4, this.width / 2); return handled();
      case "0": case "Home": this.fitAll(); return handled();
      case "]": case "[": {
        const visible = this.visibleItems();
        if (!visible.length) { this.announce("No people in view."); return handled(); }
        let i = this.focusItem ? visible.indexOf(this.focusItem) : -1;
        i = e.key === "]" ? (i + 1) % visible.length : (i <= 0 ? visible.length - 1 : i - 1);
        this.focusItem = visible[i];
        const p = this.focusItem.person;
        this.announce(`${p.name}, ${formatSpan(p.start, p.end)}${p.grade === "E" ? ", estimated" : ""}. ${i + 1} of ${visible.length} in view. Press Enter for details.`);
        this.request();
        return handled();
      }
      case "Enter":
        if (this.focusItem) { this.onSelectPerson(this.focusItem.person); handled(); }
        return undefined;
      default:
        return undefined;
    }
  }

  // ---------------------------------------------------------------- drawing
  request() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => { this.frame = 0; this.draw(); });
  }

  draw() {
    const { ctx, width, height, theme } = this;
    if (!width) return;
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);
    const [y0, y1] = this.visibleRange();
    const { ticks } = rulerTicks(y0, y1, this.pxPerYear);

    // vertical rulings
    for (const tick of ticks) {
      const x = Math.round(this.x(tick.year)) + 0.5;
      ctx.strokeStyle = theme.rule;
      ctx.globalAlpha = tick.major ? 0.9 : 0.45;
      ctx.beginPath();
      ctx.moveTo(x, RULER_H);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const epoch = this.x(0.5);
    if (epoch > 0 && epoch < width) {
      ctx.strokeStyle = theme.gold;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(Math.round(epoch) + 0.5, RULER_H);
      ctx.lineTo(Math.round(epoch) + 0.5, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.drawPeople(y0, y1);
    this.drawEvents(y0, y1);
    this.drawRuler(ticks);
    this.onView?.();
  }

  drawRuler(ticks) {
    const { ctx, width, theme } = this;
    ctx.fillStyle = theme.panel;
    ctx.fillRect(0, 0, width, TRACK_TOP - 4);
    ctx.strokeStyle = theme.rule;
    ctx.beginPath();
    ctx.moveTo(0, RULER_H + 0.5);
    ctx.lineTo(width, RULER_H + 0.5);
    ctx.moveTo(0, TRACK_TOP - 3.5);
    ctx.lineTo(width, TRACK_TOP - 3.5);
    ctx.stroke();
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    for (const tick of ticks) {
      const x = Math.round(this.x(tick.year)) + 0.5;
      ctx.strokeStyle = theme.soft;
      ctx.beginPath();
      ctx.moveTo(x, RULER_H - (tick.major ? 9 : 5));
      ctx.lineTo(x, RULER_H);
      ctx.stroke();
      ctx.fillStyle = tick.major ? theme.ink : theme.soft;
      ctx.font = `${tick.major ? 600 : 450} 11px ${theme.ui}`;
      ctx.fillText(tick.label, x + 4, RULER_H / 2 - 1);
    }
    this.redrawEventsOverRuler();
  }

  drawEvents(y0, y1) {
    // Drawn into a list first; painted after the ruler background so they sit on the panel band.
    this.pendingEvents = [];
    const rows = new Array(EVENT_ROWS).fill(-Infinity);
    const first = lowerBound(this.events, y0 - 50 / this.pxPerYear, (e) => e.year);
    for (let i = first; i < this.events.length && this.events[i].year <= y1 + 1; i++) {
      const event = this.events[i];
      const x = this.x(event.year + 0.5);
      let row = rows.findIndex((right) => right < x - 10);
      if (row === -1) continue; // crowded: the event stays reachable from chapters and people
      const label = this.pxPerYear > 0.6 ? event.name : "";
      this.ctx.font = `450 11px ${this.theme.ui}`;
      const w = label ? Math.min(220, this.ctx.measureText(label).width) : 0;
      rows[row] = x + (label ? w + 14 : 8);
      this.pendingEvents.push({ event, x, y: RULER_H + 4 + row * EVENT_ROW_H + EVENT_ROW_H / 2, label, w });
    }
  }

  redrawEventsOverRuler() {
    const { ctx, theme } = this;
    this.eventHits = this.pendingEvents ?? [];
    for (const hit of this.eventHits) {
      const { event, x, y, label, w } = hit;
      const dated = event.basis === "dated_claim";
      const active = event === this.selectedEvent || event === this.hoverEvent;
      const r = active ? 5.5 : 4.5;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = event === this.selectedEvent ? theme.rubric : theme.lapis;
      ctx.fillStyle = dated ? ctx.strokeStyle : theme.panel;
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 1;
      if (label) {
        ctx.fillStyle = active ? theme.ink : theme.soft;
        ctx.font = `${active ? 600 : 450} 11px ${theme.ui}`;
        ctx.textBaseline = "middle";
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 8, y - 8, w + 2, 16);
        ctx.clip();
        ctx.fillText(label, x + 8, y);
        ctx.restore();
      }
    }
  }

  drawPeople(y0, y1) {
    const { ctx, theme } = this;
    const firstLane = Math.max(0, Math.floor(this.scrollY / ROW_H) - 1);
    const lastLane = Math.min(this.laneItems.length - 1, Math.ceil((this.scrollY + this.height) / ROW_H));
    const familySet = this.family;
    const dimOthers = Boolean(this.selected && familySet);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, TRACK_TOP - 3, this.width, this.height);
    ctx.clip();
    ctx.textBaseline = "alphabetic";
    for (let lane = firstLane; lane <= lastLane; lane++) {
      const items = this.laneItems[lane];
      const top = this.laneTop(lane);
      for (let i = lowerBound(items, y0 - 400 / this.pxPerYear, (it) => it.person.end); i < items.length && items[i].person.start <= y1; i++) {
        const item = items[i];
        const p = item.person;
        const isSel = p === this.selected;
        const isFam = familySet?.has(p.index);
        const xs = this.x(p.start);
        const xe = Math.max(xs + 2, this.x(p.end + 1));
        const lineY = top + 19.5;
        const colour = isSel ? theme.rubric : isFam ? theme.lapis : theme.ink;
        ctx.globalAlpha = dimOthers && !isSel && !isFam ? 0.4 : 1;
        if (p.grade === "E") {
          // editorial window: dashed line with open end ticks
          ctx.strokeStyle = colour;
          ctx.lineWidth = isSel ? 2.5 : 1.6;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.moveTo(xs, lineY);
          ctx.lineTo(xe, lineY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(xs + 0.5, lineY - 3);
          ctx.lineTo(xs + 0.5, lineY + 3);
          ctx.moveTo(xe - 0.5, lineY - 3);
          ctx.lineTo(xe - 0.5, lineY + 3);
          ctx.stroke();
        } else {
          // text-anchored: solid bar
          ctx.fillStyle = colour;
          ctx.fillRect(xs, lineY - 2.5, xe - xs, 5);
        }
        if (item === this.hoverItem || item === this.focusItem) {
          ctx.strokeStyle = item === this.focusItem ? theme.rubric : theme.soft;
          ctx.setLineDash(item === this.focusItem ? [2, 2] : []);
          ctx.strokeRect(Math.min(xs, this.width) - 3.5, top + 2.5, Math.max(xe - xs, this.labelWidth(item)) + 7, ROW_H - 4);
          ctx.setLineDash([]);
        }
        // label: runs from the life start (clamped to the left edge while the life is in view) to the next life
        const room = Math.min(this.x(item.next) - 8, this.width + 400) - Math.max(xs, 2);
        if (room > 18) {
          ctx.font = this.labelFont(item);
          ctx.fillStyle = isSel ? theme.rubric : isFam ? theme.lapis : p.grade === "E" ? theme.soft : theme.ink;
          const lx = Math.max(xs, xe > 60 && xs < 4 ? 4 : xs);
          let text = p.name;
          if (ctx.measureText(text).width > room) {
            while (text.length > 1 && ctx.measureText(`${text}…`).width > room) text = text.slice(0, -1);
            text = `${text}…`;
          }
          ctx.fillText(text, lx, top + 13);
        }
      }
    }
    ctx.globalAlpha = 1;
    if (this.selected && familySet) this.drawFamilyLinks();
    ctx.restore();
  }

  drawFamilyLinks() {
    const { ctx, theme } = this;
    const sel = this.itemOf.get(this.selected.index);
    if (!sel) return;
    const link = (parentItem, childItem) => {
      const x = this.x(childItem.person.start);
      const yParent = this.laneTop(parentItem.lane) + 19.5;
      const yChild = this.laneTop(childItem.lane) + 19.5;
      ctx.beginPath();
      ctx.moveTo(x, yParent);
      ctx.bezierCurveTo(x - 14, (yParent + yChild) / 2, x - 14, (yParent + yChild) / 2, x, yChild);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, yParent, 2.2, 0, Math.PI * 2);
      ctx.fill();
    };
    ctx.strokeStyle = theme.lapis;
    ctx.fillStyle = theme.lapis;
    ctx.lineWidth = 1.2;
    const p = this.selected;
    for (const parent of p.parents) {
      const item = this.itemOf.get(parent);
      if (item) link(item, sel);
    }
    for (const child of p.children) {
      const item = this.itemOf.get(child);
      if (item) link(sel, item);
    }
    ctx.setLineDash([2, 3]);
    for (const spouse of p.spouses) {
      const item = this.itemOf.get(spouse);
      if (!item) continue;
      const x = this.x(Math.max(p.start, item.person.start) + 1);
      ctx.beginPath();
      ctx.moveTo(x, this.laneTop(sel.lane) + 19.5);
      ctx.lineTo(x, this.laneTop(item.lane) + 19.5);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
  }

  describeView() {
    const [a, b] = this.visibleRange();
    return `${formatYear(Math.round(a))} to ${formatYear(Math.round(b))}`;
  }
}
