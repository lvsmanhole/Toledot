// Director: maps scroll to story time, runs the active scene, drives post-processing, captions,
// the act rail, sound, and the gate. One continuous world, one canvas.

import * as THREE from "three";

import { Ambience } from "./audio.js";
import { createPost } from "./engine/post.js";
import { createCosmos } from "./scenes/cosmos.js";
import { createEarth } from "./scenes/earth.js";
import { createEden } from "./scenes/eden.js";
import { ACTS, CAPTIONS, LENGTH, UNIT_VH, envelope, locate } from "./script.js";
import "./style.css";

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarse = window.matchMedia("(pointer: coarse)").matches;
const quality = coarse || window.innerWidth < 800 || (navigator.deviceMemory && navigator.deviceMemory < 4) ? "low" : "high";

// ---------------------------------------------------------------- captions and rail (DOM first, so text exists without WebGL)
function buildCaptions(container) {
  return CAPTIONS.map((c) => {
    const el = document.createElement("article");
    el.className = `caption ${c.style}`;
    if (c.kicker) el.append(Object.assign(document.createElement("p"), { className: "kicker", textContent: c.kicker }));
    el.append(Object.assign(document.createElement(c.style === "title" ? "h2" : "blockquote"), { className: "text", textContent: c.text }));
    if (c.note) el.append(Object.assign(document.createElement("p"), { className: "note", textContent: c.note }));
    if (c.ref) el.append(Object.assign(document.createElement("p"), { className: "ref", textContent: c.ref }));
    container.append(el);
    return { ...c, el };
  });
}

const captions = buildCaptions($("captions"));
const railItems = ACTS.map((act) => {
  const el = document.createElement(act.built ? "button" : "span");
  el.innerHTML = '<i class="tick"></i><span class="label"></span>';
  el.querySelector(".label").textContent = `${act.label} · ${act.title}`;
  if (act.built) {
    el.type = "button";
    el.addEventListener("click", () => jumpTo(act.at + 0.01));
  } else {
    el.className = "is-future";
    el.setAttribute("aria-disabled", "true");
  }
  $("rail").append(el);
  return { act, el };
});

// ---------------------------------------------------------------- scroll <-> story units
function setScrollLength() {
  $("scroll").style.height = `${LENGTH * UNIT_VH + 100}vh`;
}
setScrollLength();
const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
const scrollUnits = () => (window.scrollY / maxScroll()) * LENGTH;
function jumpTo(u) {
  window.scrollTo({ top: (u / LENGTH) * maxScroll(), behavior: reducedMotion.matches ? "auto" : "smooth" });
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

// ---------------------------------------------------------------- WebGL
function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2"));
  } catch {
    return false;
  }
}

function fallback(reason) {
  document.body.classList.remove("is-gated");
  $("gate").remove();
  $("stage").remove();
  $("scroll").remove();
  $("cue").remove();
  const main = $("captions");
  main.className = "fallback";
  for (const c of captions) c.el.style.opacity = 1;
  const p = document.createElement("p");
  p.className = "gate-note";
  p.textContent = `${reason} The words of the journey are below; the timeline of people works in any browser.`;
  main.prepend(p);
}

const story = { u: 0, time: 0 };

async function start() {
  if (!webglAvailable()) return fallback("This browser cannot show the 3D journey (WebGL 2 is unavailable).");
  document.body.classList.add("is-gated");
  const canvas = $("stage");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, quality === "low" ? 1.25 : 1.75);
  renderer.setPixelRatio(pixelRatio);

  const post = createPost(renderer, window.innerWidth, window.innerHeight);
  const ctx = { quality };
  const status = $("gate-status");
  const scenes = {};
  // build scenes one per frame so the gate can report progress
  const builders = [["cosmos", createCosmos, "Preparing the heavens…"], ["earth", createEarth, "Gathering the waters…"], ["eden", createEden, "Planting a garden…"]];
  for (const [id, make, text] of builders) {
    status.textContent = text;
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    scenes[id] = make(ctx);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    post.setSize(w, h);
    for (const s of Object.values(scenes)) s.resize(w / h);
  }
  window.addEventListener("resize", resize);
  resize();

  // warm up shaders so the first scroll does not stutter
  for (const s of Object.values(scenes)) renderer.compile(s.scene, s.camera);
  status.textContent = "Ready";
  $("enter-sound").disabled = false;
  $("enter-silent").disabled = false;
  $("enter-sound").focus();
  const enter = (withSound) => {
    if (withSound) setSound(true);
    $("gate").classList.add("is-leaving");
    document.body.classList.remove("is-gated");
    setTimeout(() => $("gate").remove(), 1500);
  };
  $("enter-sound").addEventListener("click", () => enter(true));
  $("enter-silent").addEventListener("click", () => enter(false));

  let last = performance.now();
  let slowFrames = 0;
  story.u = scrollUnits();
  const endCard = $("end");
  const cue = $("cue");

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    story.time += dt;
    const target = scrollUnits();
    const k = 1 - Math.exp(-dt * (reducedMotion.matches ? 9 : 3.2));
    story.u += (target - story.u) * k;
    if (Math.abs(target - story.u) < 0.0005) story.u = target;
    const u = Math.min(LENGTH - 1e-4, story.u);

    const where = locate(u);
    const active = scenes[where.scene.id];
    const out = active.update({ local: where.local, time: story.time, dt, pixelRatio, reducedMotion: reducedMotion.matches });

    const g = post.grade;
    g.uTime.value = story.time;
    g.uSaturation.value = out.grade.saturation;
    g.uExposure.value = out.grade.exposure;
    g.uTint.value.set(...out.grade.tint);
    g.uGrain.value = reducedMotion.matches ? 0.02 : 0.045;
    post.bloom.strength = out.grade.bloom;
    post.bloom.threshold = out.grade.threshold ?? 0.82;
    const tr = where.transition;
    if (tr?.kind === "cloud") {
      g.uClouds.value = where.fade;
      g.uCloudTravel.value = (u - (tr.at - tr.width)) / (2 * tr.width);
      g.uFade.value = where.fade ** 4 * 0.85;
      g.uFadeColor.value.set(...tr.color);
    } else {
      g.uClouds.value = 0;
      g.uFade.value = where.fade;
      if (tr) g.uFadeColor.value.set(...tr.color);
    }
    post.setView(active.scene, active.camera);
    post.composer.render(dt);

    // captions
    for (const c of captions) {
      const e = envelope(u, c.from, c.to);
      if (e === 0 && c.el.style.opacity === "0") continue;
      c.el.style.opacity = e.toFixed(3);
      const rise = (1 - e) * 14;
      c.el.style.transform = `translate3d(0, ${(u < (c.from + c.to) / 2 ? rise : -rise).toFixed(1)}px, 0)`;
      c.el.style.filter = e < 0.999 ? `blur(${((1 - e) * 6).toFixed(2)}px)` : "none";
    }
    // rail
    let current = null;
    for (const r of railItems) if (r.act.built && u >= r.act.at - 0.5) current = r;
    for (const r of railItems) r.el.classList.toggle("is-current", r === current);
    cue.style.opacity = String(Math.max(0, 1 - u / 1.5));
    const showEnd = u > 98.5;
    if (showEnd && endCard.hidden) { endCard.hidden = false; requestAnimationFrame(() => endCard.classList.add("is-visible")); }
    if (!showEnd && !endCard.hidden) { endCard.classList.remove("is-visible"); endCard.hidden = true; }

    ambience.update(out.audio);

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
  window.__journey = { story, scenes, renderer, jumpTo }; // console access for debugging
}

start().catch((error) => {
  console.error(error);
  fallback("The 3D journey could not start.");
});
