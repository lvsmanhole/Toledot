import assert from "node:assert/strict";
import { test } from "node:test";

import { focusExtent, fold, formatSpan, formatYear, lowerBound, packLanes, rulerTicks, searchPeople } from "../js/layout.js";

test("astronomical years display with eras and no year zero", () => {
  assert.equal(formatYear(0), "1 BCE");
  assert.equal(formatYear(-999), "1000 BCE");
  assert.equal(formatYear(30), "30 CE");
  assert.equal(formatSpan(-1039, -969), "1040–970 BCE");
  assert.equal(formatSpan(-3, 30), "4 BCE – 30 CE");
});

test("lanes never overlap and reuse free space", () => {
  const items = [
    { start: 0, end: 10 }, { start: 5, end: 20 }, { start: 13, end: 30 }, { start: 23, end: 25 },
  ];
  const { lanes, count } = packLanes(items, 2);
  assert.deepEqual([...lanes], [0, 1, 0, 1]);
  assert.equal(count, 2);
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (lanes[i] === lanes[j]) assert.ok(items[i].end + 2 <= items[j].start || items[j].end + 2 <= items[i].start);
    }
  }
});

test("ruler ticks skip year zero and land on round civil years", () => {
  const { ticks } = rulerTicks(-30, 30, 10);
  const labels = ticks.map((t) => t.label);
  assert.ok(labels.includes("10 BCE") && labels.includes("10 CE"));
  assert.ok(!labels.some((l) => l.startsWith("0 ")));
  const tenBce = ticks.find((t) => t.label === "10 BCE");
  assert.equal(tenBce.year, -9);
});

test("search ranks exact and prefix matches and folds diacritics", () => {
  const mk = (name, start, aliases = [], desc = "") => ({
    name, start, fold: fold(name), aliasFold: aliases.map(fold), descFold: fold(desc), books: new Set(),
  });
  const people = [mk("Davidson", 0), mk("David", -1000), mk("Saul", -1050, ["Paul"]), mk("Jesse", -1100, [], "father of David")];
  assert.deepEqual(searchPeople(people, "david").slice(0, 2), [1, 0]);
  assert.deepEqual(searchPeople(people, "paul"), [2]);
  assert.equal(fold("Ἰησοῦς"), "ιησους");
  assert.ok(searchPeople(people, "father").includes(3));
});

test("lowerBound and focus extent", () => {
  assert.equal(lowerBound([1, 3, 5, 7], 4, (x) => x), 2);
  assert.deepEqual(focusExtent([[0, 10], [5, 20]]), [0, 20]);
  assert.equal(focusExtent([]), null);
});
