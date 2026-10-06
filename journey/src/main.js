// Director: maps scroll to story time, loads scenes around the reader, runs the active scene, drives
// post-processing, captions, the act rail, the Chronicle (the Toledot timeline in the scene), sound,
// and the gate. One canvas, one continuous story from Genesis to Revelation.

import * as THREE from "three";

import { Ambience } from "./audio.js";
import { Chronicle } from "./chronicle.js";
import { createPost } from "./engine/post.js";
import { disposeScene } from "./kit/common.js";
import { MODULES } from "./scenes/index.js";
import { ACTS, CAPTIONS, LENGTH, SCENES, UNIT_VH, envelope, locate, yearAt } from "./story.js";
import "./style.css";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarse = window.matchMedia("(pointer: coarse)").matches;
const quality = params.get("q") ?? (coarse || window.innerWidth < 800 || (navigator.deviceMemory && navigator.deviceMemory < 4) ? "low" : "high");

// ---------------------------------------------------------------- captions and rail (DOM first, so the words exist without WebGL)
const FRACTURE = ["וַיִּבֶל יְהוָה שְׂפַת", "συνέχεεν κύριος τὰ χείλη", "confudit Dominus labium", "ܒܠܒܠ ܡܪܝܐ ܠܫܢܐ", "ⲁ ⲡϭⲟⲉⲓⲥ ϣⲧⲣⲧⲣ"];
function buildCaptions(container) {
  return CAPTIONS.map((c) => {
    const el = document.createElement("article");
    el.className = `caption ${c.style}${c.fracture ? " fracture" : ""}`;
    if (c.kicker) el.append(Object.assign(document.createElement("p"), { className: "kicker", textContent: c.kicker }));
    el.append(Object.assign(document.createElement(c.style === "title" ? "h2" : "blockquote"), { className: "text", textContent: c.text }));
    if (c.fracture) {
      const shards = document.createElement("div");
      shards.className = "shards";
      shards.setAttribute("aria-hidden", "true");
      FRACTURE.forEach((s, i) => shards.append(Object.assign(document.createElement("span"), { textContent: s, style: `--i:${i}` })));
      el.append(shards);
    }
    if (c.note) el.append(Object.assign(document.createElement("p"), { className: "note", textContent: c.note }));
    if (c.ref) el.append(Object.assign(document.createElement("p"), { className: "ref", textContent: `${c.ref} · KJV` }));
    container.append(el);
    return { ...c, el };
  });
}

const captions = buildCaptions($("captions"));
const railItems = ACTS.map((act) => {
  const el = document.createElement("button");
  el.type = "button";
  el.innerHTML = '<i class="tick"></i><span class="label"></span>';
  el.querySelector(".label").textContent = `${act.label} · ${act.title}`;
  el.addEventListener("click", () => jumpTo(act.at + 0.01));
  $("rail").append(el);
  return { act, el };
});

// ---------------------------------------------------------------- scroll <-> story units
$("scroll").style.height = `${LENGTH * UNIT_VH + 100}vh`;
const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
const scrollUnits = () => (window.scrollY / maxScroll()) * LENGTH;
function jumpTo(u, smooth = !reducedMotion.matches) {
  window.scrollTo({ top: (u / LENGTH) * maxScroll(), behavior: smooth ? "smooth" : "auto" });
}
$("restart").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "auto" });
  story.u = 0;
});

// ---------------------------------------------------------------- sound
const ambience = new Ambience();
const soundButton = $("sound");
function setSound(on) {
  if (on) ambience.enable(); else ambience.disable();
  soundButton.setAttribute("aria-pressed", String(on));
  soundButton.querySelector(".sound-label").textContent = on ? "Sound on" : "Sound off";
}
soundButton.addEventListener("click", () => setSound(soundButton.getAttribute("aria-pressed") !== "true"));

// ---------------------------------------------------------------- the Chronicle
const chronicle = new Chronicle($("chronicle"));
const chronicleButton = $("chronicle-toggle");
function setChronicle(on) {
  document.body.classList.toggle("chronicle-off", !on);
  chronicleButton.setAttribute("aria-pressed", String(on));
  try { localStorage.setItem("journey-chronicle", on ? "1" : "0"); } catch { /* storage unavailable */ }
}
let chronicleOn = true;
try { chronicleOn = localStorage.getItem("journey-chronicle") !== "0"; } catch { /* storage unavailable */ }
setChronicle(chronicleOn);
chronicleButton.addEventListener("click", () => setChronicle(chronicleButton.getAttribute("aria-pressed") !== "true"));
chronicle.load("data/core.json");

// ---------------------------------------------------------------- WebGL
function webglAvailable() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

function fallback(reason) {
  document.body.classList.remove("is-gated");
  for (const id of ["gate", "stage", "scroll", "cue"]) $(id)?.remove();
  const main = $("captions");
  main.className = "fallback";
  for (const c of captions) c.el.style.opacity = 1;
  const p = document.createElement("p");
  p.className = "gate-note";
  p.textContent = `${reason} The words of the journey are below; the timeline of people works in any browser.`;
  main.prepend(p);
}

const story = { u: 0, time: 0 };

// ---------------------------------------------------------------- scene manager
const ctx = { quality };
const loaded = new Map(); // index -> { status, instance, promise }
let aspect = window.innerWidth / window.innerHeight;
let renderer;

function ensure(index) {
  if (index < 0 || index >= SCENES.length) return null;
  let entry = loaded.get(index);
  if (entry) return entry;
  const spec = SCENES[index];
  entry = { status: "loading", instance: null };
  loaded.set(index, entry);
  entry.promise = MODULES[spec.module]()
    .then((factory) => new Promise((resolve) => requestAnimationFrame(() => resolve(factory(ctx, spec)))))
    .then((instance) => {
      instance.resize(aspect);
      if (renderer) renderer.compile(instance.scene, instance.camera);
      entry.instance = instance;
      entry.status = "ready";
      return instance;
    })
    .catch((error) => {
      console.error(`scene ${spec.id} failed`, error);
      entry.status = "failed";
    });
  return entry;
}

function manage(current) {
  ensure(current);
  ensure(current + 1);
  if (current > 0) ensure(current - 1);
  for (const [index, entry] of loaded) {
    if (Math.abs(index - current) > 2 && entry.status === "ready") {
      entry.instance.activate?.(false);
      if (entry.instance.dispose) entry.instance.dispose();
      else disposeScene(entry.instance.scene);
      loaded.delete(index);
    }
  }
}

async function start() {
  if (!webglAvailable()) return fallback("This browser cannot show the 3D journey (WebGL 2 is unavailable).");
  const skipGate = params.has("nogate");
  if (!skipGate) document.body.classList.add("is-gated");
  const canvas = $("stage");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, quality === "low" ? 1.25 : 1.75);
  renderer.setPixelRatio(pixelRatio);
  const post = createPost(renderer, window.innerWidth, window.innerHeight);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    aspect = w / h;
    renderer.setSize(w, h, false);
    post.setSize(w, h);
    for (const entry of loaded.values()) entry.instance?.resize(aspect);
  }
  window.addEventListener("resize", resize);
  resize();

  // deep link: #u=123.4 starts there
  const deep = Number((location.hash.match(/u=([\d.]+)/) ?? [])[1]);
  if (deep > 0) {
    jumpTo(Math.min(LENGTH - 0.01, deep), false);
    story.u = deep;
  }
  const first = locate(Math.min(LENGTH - 0.01, story.u)).index;
  const status = $("gate-status");
  status.textContent = "Preparing the heavens…";
  manage(first);
  await loaded.get(first).promise;
  status.textContent = "Ready";
  const enter = (withSound) => {
    if (withSound) setSound(true);
    $("gate")?.classList.add("is-leaving");
    document.body.classList.remove("is-gated");
    setTimeout(() => $("gate")?.remove(), 1500);
  };
  if (skipGate) enter(false);
  else {
    $("enter-sound").disabled = false;
    $("enter-silent").disabled = false;
    $("enter-sound").focus();
    $("enter-sound").addEventListener("click", () => enter(true));
    $("enter-silent").addEventListener("click", () => enter(false));
  }

  let last = performance.now();
  let slowFrames = 0;
  let activeIndex = -1;
  let shown = null; // last scene actually drawn, held while the next one loads
  const endCard = $("end");
  const cue = $("cue");
  const veil = $("veil");

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    story.time += dt;
    const target = scrollUnits();
    const k = 1 - Math.exp(-dt * (reducedMotion.matches ? 9 : 3.2));
    story.u += (target - story.u) * k;
    if (Math.abs(target - story.u) < 0.0005) story.u = target;
    const u = Math.min(LENGTH - 1e-4, Math.max(0, story.u));
    const where = locate(u);
    if (where.index !== activeIndex) {
      loaded.get(activeIndex)?.instance?.activate?.(false);
      activeIndex = where.index;
      manage(activeIndex);
      chronicle.select(where.scene);
    }
    const entry = loaded.get(activeIndex);
    const active = entry?.status === "ready" ? entry.instance : null;
    if (active && active !== shown) {
      shown?.activate?.(false);
      active.activate?.(true);
      shown = active;
    }
    veil.classList.toggle("is-loading", !active);

    const g = post.grade;
    g.uTime.value = story.time;
    if (active) {
      const out = active.update({ local: where.local, rel: where.rel, time: story.time, dt, pixelRatio, reducedMotion: reducedMotion.matches, u });
      g.uSaturation.value = out.grade.saturation ?? 1;
      g.uExposure.value = out.grade.exposure ?? 1;
      g.uTint.value.set(...(out.grade.tint ?? [1, 1, 1]));
      post.bloom.strength = out.grade.bloom ?? 0.5;
      post.bloom.threshold = out.grade.threshold ?? 0.82;
      ambience.update(out.audio ?? {});
      post.setView(active.scene, active.camera);
    }
    g.uGrain.value = reducedMotion.matches ? 0.02 : 0.045;
    const tr = where.transition;
    if (tr?.kind === "cloud") {
      g.uClouds.value = where.fade;
      g.uCloudTravel.value = (u - (tr.at - tr.width)) / (2 * tr.width);
      g.uFade.value = where.fade ** 4 * 0.85;
      g.uFadeColor.value.set(...tr.color);
    } else {
      g.uClouds.value = 0;
      g.uFade.value = active ? where.fade : 1;
      g.uFadeColor.value.set(...(tr ? tr.color : [0, 0, 0]));
    }
    if (active) post.composer.render(dt);

    // captions
    let darkness = 0;
    for (const c of captions) {
      const e = envelope(u, c.from, c.to);
      if (c.dark) darkness = Math.max(darkness, envelope(u, c.from - 1, c.to + 1, 1.5));
      if (e === 0 && c.el.style.opacity === "0") continue;
      c.el.style.opacity = e.toFixed(3);
      const rise = (1 - e) * 14;
      c.el.style.transform = `translate3d(0, ${(u < (c.from + c.to) / 2 ? rise : -rise).toFixed(1)}px, 0)`;
      c.el.style.filter = e < 0.999 ? `blur(${((1 - e) * 6).toFixed(2)}px)` : "none";
      if (c.fracture) c.el.style.setProperty("--split", Math.max(0, Math.min(1, (u - c.from) / (c.to - c.from) * 1.6 - 0.2)).toFixed(3));
    }
    // the ninth plague: the interface itself nearly disappears
    document.body.style.setProperty("--ui-dim", (1 - darkness * 0.9).toFixed(3));

    // rail
    let current = null;
    for (const r of railItems) if (u >= r.act.at - 0.5) current = r;
    for (const r of railItems) r.el.classList.toggle("is-current", r === current);
    cue.style.opacity = String(Math.max(0, 1 - u / 1.5));
    const showEnd = u > LENGTH - 0.6;
    if (showEnd && endCard.hidden) { endCard.hidden = false; requestAnimationFrame(() => endCard.classList.add("is-visible")); }
    if (!showEnd && !endCard.hidden) { endCard.classList.remove("is-visible"); endCard.hidden = true; }

    // chronicle
    const year = yearAt(u);
    chronicle.setYear(year, year === null ? (where.index < 3 ? "Before time" : "Beyond time") : where.scene.meanwhile ?? null);
    chronicle.draw(now);

    // adaptive resolution
    if (dt > 1 / 38) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 90 && pixelRatio > 0.75) {
      pixelRatio = Math.max(0.75, pixelRatio - 0.25);
      renderer.setPixelRatio(pixelRatio);
      resize();
      slowFrames = 0;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__journey = { story, loaded, renderer, jumpTo, locate, SCENES }; // console access for debugging
}

start().catch((error) => {
  console.error(error);
  fallback("The 3D journey could not start.");
});
