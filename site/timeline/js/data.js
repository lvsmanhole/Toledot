// Loads the generated bundle (see `bible-timeline site`) and builds in-memory indexes.

import { fold } from "./layout.js";

const DATA_ROOT = new URL("../../data/", import.meta.url);

async function fetchJson(name) {
  const response = await fetch(new URL(name, DATA_ROOT));
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.json();
}

/** Text-anchored lifespans (synchronized with regnal or explicit dates) versus editorial windows. */
export const isAnchored = (person) => person.grade !== "E";

export async function loadCore() {
  const core = await fetchJson("core.json");
  const people = core.people.map((row, index) => {
    const [id, name, start, end, grade, basis, gender, classification, aliases, description] = row;
    return {
      index, id, name, start, end, grade, basis, gender, classification, aliases, description,
      fold: fold(name),
      aliasFold: aliases.map(fold),
      descFold: fold(description),
      books: new Set(),
      chapters: [],
      parents: [],
      children: [],
      spouses: [],
    };
  });
  const byId = new Map(people.map((p) => [p.id, p]));
  core.books.forEach((book, b) => {
    book.index = b;
    book.chapters.forEach((chapter, c) => {
      chapter.index = c;
      chapter.book = b;
      for (const p of chapter.people) {
        people[p].books.add(b);
        people[p].chapters.push([b, c]);
      }
    });
  });
  for (const [parent, child] of core.parents) {
    people[parent].children.push(child);
    people[child].parents.push(parent);
  }
  for (const [a, b] of core.spouses) {
    people[a].spouses.push(b);
    people[b].spouses.push(a);
  }
  const events = core.events.map((event, index) => ({ ...event, index }));
  const eventById = new Map(events.map((e) => [e.id, e]));
  const bookById = new Map(core.books.map((b) => [b.id, b]));
  // canon list id -> set of book indices
  const canonBooks = new Map();
  for (const book of core.books) {
    for (const canon of book.canons) {
      if (!canonBooks.has(canon)) canonBooks.set(canon, new Set());
      canonBooks.get(canon).add(book.index);
    }
  }
  return {
    modelId: core.model_id,
    sections: core.sections,
    books: core.books,
    canons: core.canons,
    canonBooks,
    people,
    byId,
    events,
    eventById,
    bookById,
    details: null,
  };
}

let detailsPromise = null;

/** Provenance and per-record details, fetched once after first paint. */
export function loadDetails(model) {
  if (!detailsPromise) {
    detailsPromise = fetchJson("details.json").then((details) => {
      model.details = details;
      return details;
    });
    detailsPromise.catch(() => { detailsPromise = null; });
  }
  return detailsPromise;
}
