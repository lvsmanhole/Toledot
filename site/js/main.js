// Application shell: hash routing, filters, book navigation, search, list/parallels/about views, detail panel.

import { loadCore, loadDetails } from "./data.js";
import { focusExtent, formatSpan, formatYear, searchPeople } from "./layout.js";
import { h, renderEvent, renderPerson } from "./panel.js";
import { Timeline } from "./timeline.js";

const $ = (id) => document.getElementById(id);
const VIEWS = ["timeline", "list", "parallels", "about"];
const GOSPELS = ["Matthew", "Mark", "Luke", "John"];
const LIST_PAGE = 300;

let model;
let timeline;
let route = { view: "timeline" };
let filterKey = "";
let focusKey = "";
let listLimit = LIST_PAGE;
let filtered = { people: [], events: [] };
let returnFocus = null;
let selectFromCanvas = false;

// ---------------------------------------------------------------- theme
const THEMES = ["auto", "light", "dark"];
function storedTheme() {
  try { return localStorage.getItem("toledot-theme") || "auto"; } catch { return "auto"; }
}
function applyTheme(theme) {
  if (theme === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  $("theme-toggle").title = `Colour theme: ${theme}`;
  timeline?.readTheme();
}
applyTheme(storedTheme());
$("theme-toggle").addEventListener("click", () => {
  const next = THEMES[(THEMES.indexOf(storedTheme()) + 1) % THEMES.length];
  try { localStorage.setItem("toledot-theme", next); } catch { /* storage unavailable: theme lasts this visit */ }
  applyTheme(next);
  announce(`Colour theme ${next}`);
});
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => timeline?.readTheme());

function announce(text) {
  const live = $("live");
  live.textContent = "";
  requestAnimationFrame(() => { live.textContent = text; });
}

// ---------------------------------------------------------------- routing
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  return {
    view: VIEWS.includes(path) ? path : "timeline",
    p: params.get("p"),
    e: params.get("e"),
    b: params.get("b"),
    c: params.get("c"),
    canon: params.get("canon") || "all",
    anchored: params.get("anchored") === "1",
  };
}

function hashFor(next) {
  const params = new URLSearchParams();
  for (const key of ["b", "c", "p", "e", "canon"]) {
    if (next[key] && !(key === "canon" && next[key] === "all")) params.set(key, next[key]);
  }
  if (next.anchored) params.set("anchored", "1");
  const query = params.toString();
  return `#/${next.view === "timeline" ? "" : next.view}${query ? `?${query}` : ""}`;
}

function navigate(changes, { replace = false } = {}) {
  const next = { ...route, ...changes };
  const hash = hashFor(next);
  if (hash === location.hash || (hash === "#/" && !location.hash)) return applyRoute(next);
  if (replace) {
    history.replaceState(null, "", hash);
    applyRoute(next);
  } else {
    location.hash = hash;
  }
}

window.addEventListener("hashchange", () => applyRoute(parseHash()));

// ---------------------------------------------------------------- filtering
function focusChapter(r = route) {
  const book = r.b ? model.bookById.get(r.b) : null;
  if (!book) return { book: null, chapter: null };
  const chapter = r.c ? book.chapters.find((ch) => (ch.n ?? "") === r.c) ?? null : null;
  return { book, chapter };
}

function computeFiltered(r) {
  const canonBooks = r.canon !== "all" ? model.canonBooks.get(r.canon) : null;
  const { book, chapter } = focusChapter(r);
  let people = model.people;
  if (chapter) {
    const set = new Set(chapter.people);
    people = people.filter((p) => set.has(p.index));
  } else if (book) {
    people = people.filter((p) => p.books.has(book.index));
  }
  if (canonBooks) people = people.filter((p) => [...p.books].some((b) => canonBooks.has(b)));
  if (r.anchored) people = people.filter((p) => p.grade !== "E");

  let events = model.events;
  if (chapter) {
    const set = new Set(chapter.events);
    events = events.filter((e) => set.has(e.id));
  } else if (book) {
    events = events.filter((e) => e.books.has(book.index));
  }
  if (canonBooks) events = events.filter((e) => [...e.books].some((b) => canonBooks.has(b)));
  if (r.anchored) events = events.filter((e) => e.basis === "dated_claim");
  return { people, events };
}

function applyRoute(next) {
  const prev = route;
  route = next;

  // views
  for (const view of VIEWS) $(`view-${view}`).hidden = view !== route.view;
  for (const link of document.querySelectorAll(".views a")) {
    if (link.dataset.view === route.view) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    link.href = hashFor({ ...route, view: link.dataset.view, p: null, e: null });
  }
  $("canon-select").value = route.canon;
  $("anchored-only").checked = route.anchored;

  // filters and focus
  const nextFilterKey = [route.canon, route.anchored, route.b, route.c].join("|");
  const nextFocusKey = [route.b, route.c].join("|");
  if (nextFilterKey !== filterKey) {
    filterKey = nextFilterKey;
    filtered = computeFiltered(route);
    timeline.setPeople(filtered.people);
    timeline.setEvents(filtered.events);
    listLimit = LIST_PAGE;
    if (nextFocusKey !== focusKey) {
      const extent = focusExtent(filtered.people.map((p) => [p.start, p.end]));
      if (route.b && extent) {
        timeline.scrollY = 0;
        timeline.fit(extent[0], extent[1]);
      } else if (!route.b && focusKey) timeline.fitAll();
    }
    focusKey = nextFocusKey;
    renderBookList();
    renderFocusBar();
    $("empty")?.remove();
    if (!filtered.people.length) {
      const { book, chapter } = focusChapter();
      $("view-timeline").append(h("div", { class: "empty-state", id: "empty" },
        h("p", {}, chapter ? `No individual is named in ${chapter.label}.` : "No people match these filters."),
        h("button", { class: "text-btn", onclick: () => navigate({ b: null, c: null, anchored: false, canon: "all" }) }, "Clear filters")));
      if (book && chapter) announce(`No individual is named in ${chapter.label}.`);
    }
  }

  // selection
  const person = route.p ? model.byId.get(route.p) : null;
  const event = route.e ? model.eventById.get(route.e) : null;
  if (person) {
    const family = new Set([...person.parents, ...person.children, ...person.spouses]);
    timeline.setSelection(person, family);
    timeline.setSelectedEvent(null);
    if (prev.p !== route.p && !selectFromCanvas && route.view === "timeline") timeline.reveal(person);
  } else {
    timeline.setSelection(null, null);
    timeline.setSelectedEvent(event);
    if (event && prev.e !== route.e && event.year !== null && route.view === "timeline") timeline.fit(event.year - 40, event.year + 40);
  }
  selectFromCanvas = false;
  renderPanel(prev.p !== route.p || prev.e !== route.e);

  if (route.view === "list") renderList();
  if (route.view === "parallels") renderParallels();
  if (route.view === "about") renderAbout();
  document.title = person ? `${person.name} — Toledot` : event ? `${event.name} — Toledot` : "Toledot — People of the Bible in Time";
}

// ---------------------------------------------------------------- links
function personLink(person) {
  return h("button", { class: "person-link", type: "button", onclick: () => navigate({ p: person.id, e: null }) }, person.name);
}

function eventLink(event) {
  return h("button", { class: "person-link", type: "button", onclick: () => navigate({ e: event.id, p: null }) }, event.name);
}

function chapterLink(b, c, withBook = false) {
  const book = model.books[b];
  const chapter = book.chapters[c];
  const text = withBook || chapter.n === null ? chapter.label : chapter.n;
  return h("button", {
    class: "chip", type: "button", title: `Focus on ${chapter.label}`,
    onclick: () => navigate({ view: "timeline", b: book.id, c: chapter.n ?? "" }),
  }, text);
}

const linkFor = (target) => ("start" in target ? personLink(target) : eventLink(target));

// ---------------------------------------------------------------- panel
function renderPanel(changed) {
  const panel = $("panel");
  const person = route.p ? model.byId.get(route.p) : null;
  const event = !person && route.e ? model.eventById.get(route.e) : null;
  if (!person && !event) {
    if (!panel.hidden) {
      panel.hidden = true;
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
      returnFocus = null;
    }
    return;
  }
  const opening = panel.hidden;
  const ctx = { model, details: model.details, link: linkFor, chapterLink };
  $("panel-body").replaceChildren(person ? renderPerson(person, ctx) : renderEvent(event, ctx));
  panel.hidden = false;
  if (changed) {
    $("panel-body").scrollTop = 0;
    if (opening) returnFocus = document.activeElement;
    const title = $("panel-title");
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }
}

$("panel-close").addEventListener("click", () => navigate({ p: null, e: null }));

// ---------------------------------------------------------------- books
function renderBookList() {
  const container = $("book-list");
  const canonBooks = route.canon !== "all" ? model.canonBooks.get(route.canon) : null;
  const { book: focusBook, chapter: focusChap } = focusChapter();
  container.replaceChildren(...model.sections.map((section) => {
    const books = model.books.filter((b) => b.section === section.key);
    return h("section", { class: "book-section", "aria-labelledby": `sec-${section.key}` },
      h("h2", { id: `sec-${section.key}` }, section.label),
      books.map((book) => {
        const count = model.people.reduce((n, p) => n + (p.books.has(book.index) ? 1 : 0), 0);
        const selected = book === focusBook;
        const button = h("button", {
          class: `book-btn${canonBooks && !canonBooks.has(book.index) ? " is-outside" : ""}`,
          type: "button", "aria-pressed": String(selected), "data-book": book.id,
          title: canonBooks && !canonBooks.has(book.index) ? "Not in the selected canon" : null,
          onclick: () => { navigate({ view: "timeline", b: selected && !route.c ? null : book.id, c: null }); closeDrawerOnMobile(); },
        }, h("span", {}, book.name), h("span", { class: "count", "aria-label": `${count} people` }, count));
        if (!selected || book.chapters.length < 2) return button;
        const grid = h("div", { class: "chapter-grid", role: "group", "aria-label": `${book.name} chapters` },
          book.chapters.map((ch) => h("button", {
            class: `chapter-btn${ch.people.length ? "" : " is-empty"}${String(ch.n).length > 3 ? " is-wide" : ""}`,
            type: "button", "aria-pressed": String(ch === focusChap),
            title: `${ch.label}: ${ch.people.length} ${ch.people.length === 1 ? "person" : "people"}`,
            onclick: () => { navigate({ view: "timeline", b: book.id, c: ch === focusChap ? null : ch.n }); closeDrawerOnMobile(); },
          }, ch.n ?? ch.label)));
        return [button, grid];
      }));
  }));
  const pressed = container.querySelector('.book-btn[aria-pressed="true"]');
  if (pressed && focusKey !== container.dataset.scrolledFor) {
    container.dataset.scrolledFor = focusKey;
    pressed.scrollIntoView({ block: "nearest" });
  }
}

function renderFocusBar() {
  const { book, chapter } = focusChapter();
  $("focusbar").hidden = !book;
  if (!book) return;
  const n = filtered.people.length;
  $("focus-label").replaceChildren(chapter ? chapter.label : book.name,
    h("span", { class: "muted" }, `${n} ${n === 1 ? "person" : "people"} · ${filtered.events.length} event${filtered.events.length === 1 ? "" : "s"}`));
}
$("focus-clear").addEventListener("click", () => navigate({ b: null, c: null }));

$("canon-select").addEventListener("change", (e) => navigate({ canon: e.target.value }));
$("anchored-only").addEventListener("change", (e) => navigate({ anchored: e.target.checked }));

function closeDrawerOnMobile() {
  if (window.matchMedia("(max-width: 900px)").matches) setDrawer(false);
}
function setDrawer(open) {
  $("books").classList.toggle("is-open", open);
  $("nav-toggle").setAttribute("aria-expanded", String(open));
}
$("nav-toggle").addEventListener("click", () => setDrawer(!$("books").classList.contains("is-open")));

// ---------------------------------------------------------------- search
const input = $("search-input");
const results = $("search-results");
let hits = [];
let active = -1;

function renderResults() {
  const q = input.value.trim();
  hits = q ? searchPeople(model.people, q) : [];
  active = hits.length ? 0 : -1;
  results.hidden = !q;
  input.setAttribute("aria-expanded", String(Boolean(q)));
  if (!q) return;
  if (!hits.length) {
    results.replaceChildren(h("li", { class: "r-empty", role: "option", "aria-disabled": "true" }, `No one named “${q}”.`));
    input.removeAttribute("aria-activedescendant");
    return;
  }
  results.replaceChildren(...hits.map((i, n) => {
    const p = model.people[i];
    const first = p.chapters[0] ? model.books[p.chapters[0][0]].chapters[p.chapters[0][1]].label : "";
    return h("li", {
      id: `hit-${n}`, role: "option", "aria-selected": String(n === active),
      onmousedown: (e) => { e.preventDefault(); choose(n); },
    },
    h("span", { class: "r-name" }, p.name),
    h("span", { class: "r-years" }, formatSpan(p.start, p.end), p.grade === "E" ? " (est.)" : ""),
    h("span", { class: "r-desc" }, p.description || (first ? `Named in ${first}` : "")));
  }));
  input.setAttribute("aria-activedescendant", "hit-0");
  announce(`${hits.length} ${hits.length === 1 ? "match" : "matches"}`);
}

function moveActive(delta) {
  if (!hits.length) return;
  results.querySelector(`#hit-${active}`)?.setAttribute("aria-selected", "false");
  active = (active + delta + hits.length) % hits.length;
  const el = results.querySelector(`#hit-${active}`);
  el.setAttribute("aria-selected", "true");
  el.scrollIntoView({ block: "nearest" });
  input.setAttribute("aria-activedescendant", el.id);
}

function choose(n) {
  const p = model.people[hits[n]];
  results.hidden = true;
  input.setAttribute("aria-expanded", "false");
  input.value = "";
  const visible = filtered.people.includes(p);
  navigate({ view: route.view === "timeline" || route.view === "list" ? route.view : "timeline", p: p.id, e: null,
    ...(visible ? {} : { b: null, c: null, canon: "all", anchored: false }) });
}

input.addEventListener("input", renderResults);
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { moveActive(1); e.preventDefault(); }
  else if (e.key === "ArrowUp") { moveActive(-1); e.preventDefault(); }
  else if (e.key === "Enter" && active >= 0) { choose(active); e.preventDefault(); }
  else if (e.key === "Escape") { input.value = ""; renderResults(); e.stopPropagation(); }
});
input.addEventListener("blur", () => { results.hidden = true; input.setAttribute("aria-expanded", "false"); });
input.addEventListener("focus", () => { if (input.value.trim()) renderResults(); });

document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName);
  if (e.key === "/" && !typing) { e.preventDefault(); input.focus(); }
  else if (e.key === "Escape" && !typing && (route.p || route.e)) navigate({ p: null, e: null });
});

// ---------------------------------------------------------------- list view
function renderList() {
  const people = filtered.people;
  $("list-count").textContent = `· ${people.length.toLocaleString()}`;
  const rows = people.slice(0, listLimit).map((p) => {
    const first = p.chapters[0] ? model.books[p.chapters[0][0]].chapters[p.chapters[0][1]].label : "—";
    return h("tr", {},
      h("td", {}, personLink(p)),
      h("td", {}, formatSpan(p.start, p.end)),
      h("td", {}, h("span", { class: `grade grade-${p.grade}`, title: p.grade === "E" ? "Editorial estimate" : "Synchronized with dated text" }, p.grade), p.grade === "E" ? " estimate" : " text-anchored"),
      h("td", {}, p.description),
      h("td", {}, first));
  });
  $("list-body").replaceChildren(...rows);
  $("list-more").hidden = people.length <= listLimit;
  $("list-more").textContent = `Show ${Math.min(LIST_PAGE, people.length - listLimit).toLocaleString()} more`;
}
$("list-more").addEventListener("click", () => { listLimit += LIST_PAGE; renderList(); });

// ---------------------------------------------------------------- parallels view
function locatorKey(locator) {
  const m = locator.match(/ (\d+):(\d+)/);
  return m ? Number(m[1]) * 1000 + Number(m[2]) : 0;
}

function renderParallels() {
  const body = $("parallels-body");
  const events = model.events.filter((e) => e.gospels.length > 1);
  $("parallels-count").textContent = `· ${events.length} events`;
  if (!model.details) {
    body.replaceChildren(h("p", { class: "muted loading" }, "Loading citations…"));
    return;
  }
  const cites = (e) => model.details.events[e.id].cites;
  const order = (e) => {
    for (const g of ["Mark", "Matthew", "Luke", "John"]) {
      const c = cites(e).find((x) => x.locator.startsWith(`${g} `));
      if (c) return ["Mark", "Matthew", "Luke", "John"].indexOf(g) * 1e6 + locatorKey(c.locator);
    }
    return 9e9;
  };
  events.sort((a, b) => order(a) - order(b));
  body.replaceChildren(h("table", { class: "parallels-table" },
    h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Event"), GOSPELS.map((g) => h("th", { scope: "col" }, g)))),
    h("tbody", {}, events.map((e) => h("tr", {},
      h("td", {}, eventLink(e)),
      GOSPELS.map((g) => {
        const refs = cites(e).filter((c) => c.locator.startsWith(`${g} `)).map((c) => c.locator.slice(g.length + 1));
        return h("td", { class: `ref-cell${refs.length ? "" : " is-empty"}` }, refs.length ? refs.join("; ") : "—");
      }))))));
}

// ---------------------------------------------------------------- about view
function renderAbout() {
  const body = $("about-body");
  const anchored = model.people.filter((p) => p.grade !== "E").length;
  const dated = model.events.filter((e) => e.basis === "dated_claim").length;
  const sources = model.details ? Object.entries(model.details.sources) : [];
  body.replaceChildren(
    h("h2", {}, "How to read this timeline"),
    h("p", {}, `Toledot places ${model.people.length.toLocaleString()} people and ${model.events.length} events from ${model.books.length} books: the Protestant canon, the Septuagint additions, and the wider Ethiopian Orthodox canon. Each person appears in every chapter that names them in the base text of the book (Leningrad Codex for the Hebrew Bible, NA28 for the New Testament).`),
    h("h3", {}, "Two kinds of dates"),
    h("p", {}, `The Bible rarely gives calendar years. Only ${anchored} lifespans are tied to dated text (regnal synchronisms, explicit ages, or securely dated rulers); they are drawn as solid bars. Every other life, ${(model.people.length - anchored).toLocaleString()} in all, is an editorial window, drawn dashed and marked grade E. Those windows keep the text's relative order (parents before children, contemporaries together) but their calendar years are a display convention, not a claim.`),
    h("dl", {},
      h("dt", {}, h("span", { class: "grade grade-A" }, "A")), h("dd", {}, "Stated explicitly in a cited witness of the original text."),
      h("dt", {}, h("span", { class: "grade grade-B" }, "B")), h("dd", {}, "Stated in a cited translation (for books whose original is not used here), or calculated transparently from explicit text."),
      h("dt", {}, h("span", { class: "grade grade-C" }, "C")), h("dd", {}, "Synchronized with dated text and an external anchor (for example a regnal chronology)."),
      h("dt", {}, h("span", { class: "grade grade-D" }, "D")), h("dd", {}, "Synchronized, but depending on a chronology choice (for example Septuagint versus Masoretic ages)."),
      h("dt", {}, h("span", { class: "grade grade-E" }, "E")), h("dd", {}, "Editorial estimate: the placement window, not the text.")),
    h("p", {}, `Events: ${dated} carry a dated anchor and are drawn as filled diamonds. The rest are placed where their participants' lifespans overlap, drawn as open diamonds.`),
    h("h3", {}, "Witnesses kept apart"),
    h("p", {}, "Masoretic, Septuagint, Samaritan and Geʽez readings stay distinct claims; where they disagree, as with the patriarchs' ages, each reading is kept and the chronology used for display is named. People with the same name are separate records unless the text identifies them. Conflicting genealogies are shown as claims rather than merged into one family tree."),
    h("h3", {}, "Gospel parallels"),
    h("p", {}, "Events told in more than one Gospel are one record citing each Gospel's passage, so the parallels can be compared side by side."),
    h("h3", {}, "Sources and licences"),
    sources.length
      ? h("ul", { class: "source-list" }, sources.map(([, s]) => h("li", {}, s.url ? h("a", { href: s.url, rel: "noopener", target: "_blank" }, s.title) : s.title,
        h("span", { class: "license" }, s.license.replace(/_/g, " ")), h("div", { class: "muted" }, s.locator))))
      : h("p", { class: "muted loading" }, "Loading the source catalogue…"),
    h("p", { class: "muted" }, `Chronology model: ${model.modelId}. No copyrighted Bible text is reproduced; the site shows references, name forms and numbers only.`));
}

// ---------------------------------------------------------------- tooltip and status
const tooltip = $("tooltip");
function showTooltip(person, event, x, y) {
  if (!person && !event) { tooltip.hidden = true; return; }
  if (person) {
    tooltip.replaceChildren(h("strong", {}, person.name),
      h("div", { class: "t-meta" }, formatSpan(person.start, person.end), person.grade === "E" ? " · estimate" : " · text-anchored"),
      person.description ? h("div", {}, person.description) : null);
  } else {
    tooltip.replaceChildren(h("strong", {}, event.name),
      h("div", { class: "t-meta" }, `${event.basis === "dated_claim" ? "" : "c. "}${formatYear(event.year)}`, event.basis === "dated_claim" ? " · dated" : " · placed by participants"));
  }
  tooltip.hidden = false;
  const r = tooltip.getBoundingClientRect();
  tooltip.style.left = `${Math.min(window.innerWidth - r.width - 8, x + 14)}px`;
  tooltip.style.top = `${y + 18 + r.height > window.innerHeight ? y - r.height - 10 : y + 18}px`;
}

let statusFrame = 0;
function updateStatus() {
  if (statusFrame) return;
  statusFrame = requestAnimationFrame(() => {
    statusFrame = 0;
    $("status").textContent = `${filtered.people.length.toLocaleString()} people · ${timeline.describeView()}`;
  });
}

// ---------------------------------------------------------------- boot
async function boot() {
  timeline = new Timeline($("timeline"), {
    onSelectPerson: (p) => { selectFromCanvas = true; navigate({ p: p.id, e: null }); },
    onSelectEvent: (e) => { selectFromCanvas = true; navigate({ e: e.id, p: null }); },
    onHover: showTooltip,
    announce,
  });
  timeline.onView = updateStatus;
  window.toledot = { get timeline() { return timeline; }, get model() { return model; } }; // console access for debugging
  try {
    model = await loadCore();
  } catch (error) {
    const loading = $("loading");
    loading.classList.add("is-error");
    loading.replaceChildren(
      h("span", { class: "loading-initial", "aria-hidden": "true" }, "T"),
      h("p", {}, "The timeline data could not be loaded."),
      h("p", { class: "muted" }, "Generate it with ", h("code", {}, "bible-timeline site"), " and serve the ", h("code", {}, "site/"), " folder over HTTP, e.g. ", h("code", {}, "python -m http.server -d site"), "."),
      h("p", { class: "muted" }, String(error.message || error)));
    return;
  }
  for (const event of model.events) event.books = new Set();
  for (const book of model.books) {
    for (const chapter of book.chapters) for (const id of chapter.events) model.eventById.get(id)?.books.add(book.index);
  }
  $("search-input").placeholder = `Search ${model.people.length.toLocaleString()} people…`;
  $("loading").remove();
  applyRoute(parseHash());
  if (!location.hash || location.hash === "#/") timeline.fitAll();
  loadDetails(model).then(() => {
    renderPanel(false);
    if (route.view === "parallels") renderParallels();
    if (route.view === "about") renderAbout();
  }).catch(() => {
    announce("Provenance details could not be loaded.");
    for (const el of document.querySelectorAll(".loading")) el.textContent = "Provenance details could not be loaded.";
  });
}

$("zoom-in").addEventListener("click", () => timeline.zoomAt(1.5, timeline.width / 2));
$("zoom-out").addEventListener("click", () => timeline.zoomAt(1 / 1.5, timeline.width / 2));
$("zoom-fit").addEventListener("click", () => timeline.fitAll());

boot();
