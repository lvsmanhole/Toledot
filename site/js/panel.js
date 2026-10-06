// Detail panel content for people and events. Builds DOM nodes directly (no HTML string interpolation).

import { formatSpan, formatYear } from "./layout.js";

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") el.className = value;
    else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

const GRADE_TEXT = {
  A: "Explicit in the text",
  B: "Explicit in a translation, or calculated from explicit text",
  C: "Synchronized with dated text",
  D: "Synchronized, with assumptions",
  E: "Editorial estimate",
};

const EVIDENCE_TEXT = {
  explicit_text: "stated in the text",
  calculated: "calculated from the text",
  editorial_anchor: "editorial anchor",
  editorial_inference: "editorial inference",
};

const TRADITION_TEXT = {
  masoretic: "Hebrew (Masoretic)",
  septuagint: "Greek (Septuagint)",
  geez: "Geʽez (Ethiopic)",
  samaritan: "Samaritan Pentateuch",
  new_testament: "Greek New Testament",
  translation_of_greek: "English translation of the Greek",
  translation_of_geez: "English translation of the Geʽez",
};

const RELATION_TEXT = {
  parent: "Parent of", child: "Child of", spouse: "Spouse of", ancestor: "Ancestor of", descendant: "Descendant of",
  successor_of: "Successor of", predecessor_of: "Predecessor of", member_of: "Member of", affinal: "In-law of",
  possible_identity: "Possibly the same as",
};

const PREDICATE_TEXT = {
  lifespan: "Lifespan",
  age_at_birth_of: "Age at the birth of",
  age_at_accession: "Age at accession",
  age_at_event: "Age at",
  age_at_death: "Age at death",
  reign_length: "Length of reign",
  reign: "Reign",
  reign_years: "Reign",
  judged_years: "Judged Israel",
  rest_years: "Land at rest",
  oppression_years: "Oppression lasted",
  death_attested: "Death recorded",
  death_event: "Death narrated",
  birth_year: "Birth year",
  parent_reference: "Genealogy names as parent",
  possible_identity: "Possibly the same person as",
  affinal_kinship: "Related by marriage to",
  event_date: "Display year",
  event_date_in_text: "Dated in the text",
  regnal_date: "Regnal date",
  relative_event_date: "Dated relative to",
  event_duration: "Duration",
};

const humanize = (key) => key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

function formatValue(value, model) {
  switch (value.kind) {
    case "duration":
      return value.text && !/^\d+ years?$/.test(value.text) ? `${value.value} ${value.unit} (“${value.text}”)` : `${value.value} ${value.unit}`;
    case "historical_year":
      return `${value.year} ${value.era}`;
    case "regnal_date": {
      const king = value.king_text || model.byId.get(value.king)?.name || value.king || "the king";
      const md = [value.month && `month ${value.month}`, value.day && `day ${value.day}`].filter(Boolean).join(", ");
      return `Year ${value.year_number} of ${king}${md ? `, ${md}` : ""}`;
    }
    case "relative_date": {
      if (!value.reference_event) return "Dated relative to another event in the text";
      const ref = model.eventById.get(value.reference_event)?.name || value.reference_event;
      const md = [value.month_number && `month ${value.month_number}`, value.day_number && `day ${value.day_number}`].filter(Boolean).join(", ");
      return `Year ${value.year_number} after ${ref}${md ? `, ${md}` : ""}`;
    }
    case "event_reference":
      return model.eventById.get(value.event_id)?.name || value.event_id;
    default: {
      const parts = Object.entries(value).filter(([k]) => k !== "kind").map(([k, v]) => `${humanize(k)}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
      return parts.join("; ") || humanize(value.kind || "");
    }
  }
}

function witnessLabel(details, witnessId) {
  const w = details?.witnesses[witnessId];
  if (!w) return witnessId;
  return `${TRADITION_TEXT[w.tradition] || humanize(w.tradition)} · ${w.edition}`;
}

function citationList(citations, details) {
  return h("ul", { class: "cites" }, citations.map((c) => {
    const source = details?.sources[c.source_id];
    return h("li", {},
      h("span", { class: "ref" }, c.locator),
      " ",
      h("span", { class: "muted" }, c.witness_id ? witnessLabel(details, c.witness_id) : source?.title || c.source_id),
      c.direct === false ? h("span", { class: "tag" }, "indirect") : null,
      c.note ? h("div", { class: "note" }, c.note) : null);
  }));
}

function claimCard(claim, ctx) {
  const { model, details, link } = ctx;
  const label = PREDICATE_TEXT[claim.predicate] || humanize(claim.predicate);
  const object = claim.object ? (model.byId.get(claim.object) || model.eventById.get(claim.object)) : null;
  return h("li", { class: `claim ev-${claim.evidence}` },
    h("div", { class: "claim-head" },
      h("span", { class: "claim-label" }, label, object ? " " : null, object ? link(object) : (claim.object ? ` ${details?.others[claim.object]?.name || claim.object}` : null)),
      h("span", { class: `grade grade-${claim.confidence}`, title: GRADE_TEXT[claim.confidence] }, claim.confidence)),
    h("div", { class: "claim-value" }, formatValue(claim.value, model)),
    h("div", { class: "claim-meta" }, EVIDENCE_TEXT[claim.evidence] || humanize(claim.evidence), claim.witness ? ` · ${witnessLabel(details, claim.witness)}` : null),
    claim.note ? h("p", { class: "note" }, claim.note) : null,
    h("details", { class: "claim-cites" }, h("summary", {}, `${claim.citations.length} citation${claim.citations.length === 1 ? "" : "s"}`), citationList(claim.citations, details)));
}

function section(title, ...body) {
  const content = body.flat().filter(Boolean);
  if (!content.length) return null;
  return h("section", { class: "panel-section" }, h("h3", {}, title), content);
}

function datesBlock(person) {
  const anchored = person.grade !== "E";
  return h("div", { class: `dates ${anchored ? "is-anchored" : "is-estimate"}` },
    h("div", { class: "dates-years" }, formatSpan(person.start, person.end)),
    h("div", { class: "dates-grade" },
      h("span", { class: `grade grade-${person.grade}` }, person.grade),
      " ",
      anchored ? GRADE_TEXT[person.grade] : "Editorial estimate. The text gives no calendar date; the window is a display convention."));
}

export function renderPerson(person, ctx) {
  const { model, details, link, chapterLink } = ctx;
  const d = details?.people[person.id];
  const original = d ? [...new Map(d.names.map(([form, language]) => [form, language])).entries()] : [];
  const relations = d ? groupRelations(d.relations, model, details, link) : [];
  const books = new Map();
  for (const [b, c] of person.chapters) {
    if (!books.has(b)) books.set(b, []);
    books.get(b).push(c);
  }
  const textClaims = d ? d.claims.filter((c) => c.evidence === "explicit_text" || c.evidence === "calculated") : [];
  const editorial = d ? d.claims.filter((c) => !(c.evidence === "explicit_text" || c.evidence === "calculated")) : [];
  const linked = d?.linked_claims ?? [];
  const attested = d ? groupAttested(d.attested, details) : [];

  return h("article", { class: "detail" },
    h("p", { class: "eyebrow" }, person.classification === "named_person" ? "Person" : "Unnamed person"),
    h("h2", { class: "detail-title", id: "panel-title" }, person.name),
    person.aliases.length ? h("p", { class: "aliases" }, "Also: ", person.aliases.join(", ")) : null,
    original.length ? h("p", { class: "original" }, original.slice(0, 4).map(([form, language]) =>
      h("span", { class: "orig", lang: /Hebrew/.test(language) ? "he" : /Greek/.test(language) ? "grc" : null, dir: /Hebrew/.test(language) ? "rtl" : null, title: language }, form))) : null,
    person.description ? h("p", { class: "description" }, person.description) : null,
    datesBlock(person),
    d ? h("p", { class: "explanation" }, d.explanation) : h("p", { class: "muted loading" }, "Loading provenance…"),
    section("Family", relations.map(([label, others]) => h("div", { class: "relation" },
      h("span", { class: "relation-label" }, label), h("span", { class: "relation-people" }, others.map((o, i) => [i ? ", " : null, o]))))),
    section("What the text says", textClaims.length ? h("ul", { class: "claims" }, textClaims.map((c) => claimCard(c, ctx))) : null),
    section("Used for this placement", linked.length ? h("ul", { class: "claims" }, linked.map((c) => claimCard(c, ctx))) : null),
    section("Editorial claims", editorial.length ? h("ul", { class: "claims" }, editorial.map((c) => claimCard(c, ctx))) : null),
    section(`Appears in ${books.size} book${books.size === 1 ? "" : "s"}`, [...books.entries()].map(([b, cs]) => h("div", { class: "appear" },
      h("span", { class: "appear-book" }, model.books[b].name),
      h("span", { class: "chips" }, cs.map((c) => chapterLink(b, c)))))),
    section("Named in these witnesses", attested.map(([tradition, rows]) => h("div", { class: "witness-group" },
      h("h4", {}, tradition),
      h("ul", { class: "cites" }, rows.map(([wid, loc]) => h("li", {}, h("span", { class: "ref" }, loc), " ", h("span", { class: "muted" }, details.witnesses[wid]?.edition || wid))))))),
    d ? section("Index sources", citationList(d.cites, details)) : null);
}

function groupRelations(relations, model, details, link) {
  const groups = new Map();
  for (const [kind, other] of relations) {
    const label = RELATION_TEXT[kind] || humanize(kind);
    if (!groups.has(label)) groups.set(label, []);
    const person = model.byId.get(other);
    groups.get(label).push(person ? person : details.others[other]?.name || other);
  }
  // "Child of X" reads as the parents; present it as "Parents" etc.
  const rename = { "Child of": "Parents", "Parent of": "Children", "Spouse of": "Spouses" };
  return [...groups.entries()].map(([label, people]) => [rename[label] || label, people.map((p) => (typeof p === "string" ? p : link(p)))]);
}

function groupAttested(attested, details) {
  const groups = new Map();
  for (const [wid, loc] of attested) {
    const tradition = TRADITION_TEXT[details.witnesses[wid]?.tradition] || "Other";
    if (!groups.has(tradition)) groups.set(tradition, []);
    groups.get(tradition).push([wid, loc]);
  }
  return [...groups.entries()];
}

export function renderEvent(event, ctx) {
  const { model, details, link, chapterLink } = ctx;
  const d = details?.events[event.id];
  const basisText = {
    dated_claim: "Display year from a dated anchor; see the date claims below.",
    participants: "Placed within the years its participants are alive together, with the youngest taken as an adult. Editorial placement, not a date in the text.",
    chapter: "Placed at the approximate setting of the chapters that narrate it. Editorial placement.",
    unplaced: "Not placed on the timeline.",
  }[event.basis];
  const gospelCites = d ? d.cites.filter((c) => event.gospels.includes(c.locator.split(" ")[0])) : [];
  return h("article", { class: "detail" },
    h("p", { class: "eyebrow" }, `Event · ${humanize(event.type)}`),
    h("h2", { class: "detail-title", id: "panel-title" }, event.name),
    d?.description ? h("p", { class: "description" }, d.description) : null,
    h("div", { class: `dates ${event.basis === "dated_claim" ? "is-anchored" : "is-estimate"}` },
      h("div", { class: "dates-years" }, event.year === null ? "Undated" : `${event.basis === "dated_claim" ? "" : "c. "}${formatYear(event.year)}`),
      h("div", { class: "dates-grade" }, event.grade ? h("span", { class: `grade grade-${event.grade}` }, event.grade) : null, " ", basisText)),
    event.gospels.length > 1 ? section("Gospel parallels", h("div", { class: "parallel-mini" }, ["Matthew", "Mark", "Luke", "John"].map((g) => {
      const cites = gospelCites.filter((c) => c.locator.startsWith(`${g} `));
      return h("div", { class: `pm-col ${cites.length ? "" : "is-empty"}` }, h("span", { class: "pm-gospel" }, g), cites.length ? cites.map((c) => h("span", { class: "ref" }, c.locator.slice(g.length + 1))) : h("span", { class: "muted" }, "—"));
    }))) : null,
    !d ? h("p", { class: "muted loading" }, "Loading provenance…") : null,
    d ? section("Date claims", d.date_claims.length ? h("ul", { class: "claims" }, d.date_claims.map((c) => claimCard(c, ctx))) : h("p", { class: "muted" }, "The text attaches no date to this event.")) : null,
    d ? section("People", h("ul", { class: "participants" }, d.participants.map(([id, role]) => {
      const p = model.byId.get(id);
      return h("li", {}, p ? link(p) : details.others[id]?.name || id, role && role !== "named participant" ? h("span", { class: "muted" }, ` · ${role}`) : null);
    }))) : null,
    d ? section("Narrated in", h("span", { class: "chips" }, d.chapters.map(([b, c]) => chapterLink(b, c, true)))) : null,
    d ? section("Citations", citationList(d.cites, details)) : null);
}
