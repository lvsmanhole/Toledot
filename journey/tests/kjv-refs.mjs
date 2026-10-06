// Reference parsing shared by the KJV fixture script and the caption test.

export const BOOK_CODES = {
  Genesis: "GEN", Exodus: "EXO", Leviticus: "LEV", Numbers: "NUM", Deuteronomy: "DEU", Joshua: "JOS", Judges: "JDG", Ruth: "RUT",
  "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH",
  Ezra: "EZR", Nehemiah: "NEH", Esther: "EST", Job: "JOB", Psalm: "PSA", Psalms: "PSA", Proverbs: "PRO", Ecclesiastes: "ECC",
  Isaiah: "ISA", Jeremiah: "JER", Lamentations: "LAM", Ezekiel: "EZE", Daniel: "DAN", Hosea: "HOS", Joel: "JOE", Amos: "AMO",
  Jonah: "JON", Micah: "MIC", Habakkuk: "HAB", Zechariah: "ZEC", Malachi: "MAL", "1 Maccabees": "1MA",
  Matthew: "MAT", Mark: "MAR", Luke: "LUK", John: "JOH", Acts: "ACT", Romans: "ROM", "2 Timothy": "2TI", Revelation: "REV",
};

/** "Genesis 22:2" -> ["GEN 22:2"]; "Luke 3:23–38" -> each verse; "Joshua 6" (chapter only) -> []. */
export function refsOf(ref) {
  const m = ref.match(/^(.+?) (\d+):(\d+)(?:[–-](\d+))?$/);
  if (!m) return [];
  const code = BOOK_CODES[m[1]];
  if (!code) throw new Error(`unknown book in ${ref}`);
  const from = Number(m[3]);
  const to = Number(m[4] ?? m[3]);
  return Array.from({ length: to - from + 1 }, (_, i) => `${code} ${m[2]}:${from + i}`);
}

const norm = (s) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Every "…"-separated fragment of the caption must occur, in order, in the referenced verse text. */
export function captionMatches(text, verses) {
  const hay = norm(verses.join(" "));
  let pos = 0;
  for (const part of text.split("…").map(norm).filter(Boolean)) {
    const at = hay.indexOf(part, pos);
    if (at < 0) return false;
    pos = at + part.length;
  }
  return true;
}
