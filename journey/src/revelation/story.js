// The Revelation, chapters 1 to 22, as an ordered list of scenes on one scroll axis, seen through the eyes
// of John on Patmos. Scripture is quoted from the King James Version (as in the Journey, story.js); tests
// check every caption against the KJV text. Each scene says which verses it shows (`covers`), and tests
// check that every verse of the chapters built so far is shown, in order. There are no years: the whole
// vision is one moment, about AD 95.

import { envelope, layout } from "../storyline.js";

export const UNIT_VH = 18;

/** Verses in each chapter of Revelation (KJV), chapter 1 first: 404 in all. */
export const CHAPTER_VERSES = [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21];

/** Chapters built so far: tests require every verse of chapters 1..BUILT to be shown by some scene. */
export const BUILT = 5;

/** The end card: the book's last words when all 22 chapters are made, until then how far the vision goes. */
export function endCard(built) {
  if (built >= 22) return { kicker: "Amen", line: "The grace of our Lord Jesus Christ be with you all. — Revelation 22:21" };
  return { kicker: "To be continued", line: `The vision is shown here through chapters 1–${built}. The rest of the book is being made.` };
}

/** "4:1-3" -> ["4:1", "4:2", "4:3"]; "1:9" -> ["1:9"]; "2-3" or "5" (whole chapters) -> every verse in them. */
export function versesOf(range) {
  const m = range.match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (m) {
    const [c, a, b = a] = m.slice(1).filter(Boolean).map(Number);
    return Array.from({ length: b - a + 1 }, (_, i) => `${c}:${a + i}`);
  }
  const [a, b = a] = range.split("-").map(Number);
  const out = [];
  for (let c = a; c <= b; c++) for (let n = 1; n <= CHAPTER_VERSES[c - 1]; n++) out.push(`${c}:${n}`);
  return out;
}

const L = { light: [1, 0.97, 0.9], dark: [0, 0, 0], night: [0.02, 0.03, 0.05], gold: [0.95, 0.78, 0.45] };
const t = (kind, width = 2) => ({ kind: kind === "cloud" ? "cloud" : "fade", color: L[kind] ?? L.dark, width });

// caption helpers: v = verse, h = monumental title, n = note (no scripture)
const v = (from, to, text, ref, kicker) => ({ from, to, style: "verse", text, ref, kicker });
const h = (from, to, text, ref, note) => ({ from, to, style: "title", text, ref, note });
const n = (from, to, text, kicker) => ({ from, to, style: "note", text, kicker });

/** The seven letters (2–3) in one scene: an opening, then each letter (Laodicea's is longer: the door, then the throne). */
export const LETTERS = [15, 15, 15, 15, 15, 15, 19];
export const letterStart = (i) => 2 + LETTERS.slice(0, i).reduce((a, b) => a + b, 0);
// each letter's captions, at these offsets from its start: title, charge, charge, promise (and Laodicea's throne)
const SLOTS = [[0.5, 3.9], [4.3, 7.7], [8.1, 11.2], [11.6, 14.5], [15.2, 18.5]];
const letter = (i, ...caps) => caps.map(([text, ref, kicker], k) => v(letterStart(i) + SLOTS[k][0], letterStart(i) + SLOTS[k][1], text, ref, kicker));

export const SCENES = [
  // ---------------------------------------------------------------- Prologue (1:1–8)
  {
    id: "prologue", module: "prologue", length: 28, enter: null, years: null, covers: ["1:1-8"], creatures: [],
    acts: [{ label: "Prologue", title: "The Revelation of Jesus Christ", at: 0 }],
    captions: [
      h(2, 6, "The Revelation of Jesus Christ", "Revelation 1:1"),
      v(6.5, 10.5, "he sent and signified it by his angel unto his servant John", "Revelation 1:1"),
      v(11, 14.5, "Blessed is he that readeth, and they that hear the words of this prophecy", "Revelation 1:3"),
      v(15, 19, "Grace be unto you, and peace, from him which is, and which was, and which is to come; and from the seven Spirits which are before his throne", "Revelation 1:4"),
      v(19.5, 23, "Behold, he cometh with clouds; and every eye shall see him", "Revelation 1:7"),
      h(23.5, 27.3, "I am Alpha and Omega, the beginning and the ending", "Revelation 1:8"),
    ],
  },
  // ---------------------------------------------------------------- I. Patmos (1:9–11)
  {
    id: "patmos", module: "patmos", length: 24, enter: t("dark", 2), years: null, covers: ["1:9-11"], creatures: ["john"],
    acts: [{ label: "I", title: "The Son of Man", at: 0 }],
    captions: [
      v(2, 6.5, "I John … was in the isle that is called Patmos, for the word of God, and for the testimony of Jesus Christ.", "Revelation 1:9"),
      v(7, 10.5, "I was in the Spirit on the Lord’s day", "Revelation 1:10"),
      v(11, 14.5, "and heard behind me a great voice, as of a trumpet", "Revelation 1:10"),
      v(15, 21.5, "What thou seest, write in a book, and send it unto the seven churches which are in Asia; unto Ephesus, and unto Smyrna, and unto Pergamos, and unto Thyatira, and unto Sardis, and unto Philadelphia, and unto Laodicea.", "Revelation 1:11"),
    ],
  },
  {
    id: "sonofman", module: "sonofman", length: 36, enter: t("light", 1.2), years: null, covers: ["1:12-20"], creatures: ["sonOfMan", "keys"],
    captions: [
      v(1.5, 5, "And I turned to see the voice that spake with me. And being turned, I saw seven golden candlesticks", "Revelation 1:12"),
      v(5.5, 9.5, "one like unto the Son of man, clothed with a garment down to the foot, and girt about the paps with a golden girdle.", "Revelation 1:13"),
      v(10, 13.5, "His head and his hairs were white like wool, as white as snow; and his eyes were as a flame of fire", "Revelation 1:14"),
      v(14, 17, "And his feet like unto fine brass, as if they burned in a furnace; and his voice as the sound of many waters.", "Revelation 1:15"),
      v(17.5, 21, "And he had in his right hand seven stars: and out of his mouth went a sharp twoedged sword: and his countenance was as the sun shineth in his strength.", "Revelation 1:16"),
      v(21.5, 25, "And when I saw him, I fell at his feet as dead. And he laid his right hand upon me, saying unto me, Fear not; I am the first and the last", "Revelation 1:17"),
      v(25.5, 29, "I am he that liveth, and was dead; and, behold, I am alive for evermore, Amen; and have the keys of hell and of death.", "Revelation 1:18"),
      v(29.5, 32, "Write the things which thou hast seen, and the things which are, and the things which shall be hereafter", "Revelation 1:19"),
      v(32.3, 35.5, "The seven stars are the angels of the seven churches: and the seven candlesticks which thou sawest are the seven churches.", "Revelation 1:20"),
    ],
  },
  // ---------------------------------------------------------------- II. The seven churches (2–3)
  {
    id: "churchesmap", module: "maps", program: "churches", length: 12, enter: t("dark", 1.5), years: null, covers: [], creatures: [],
    acts: [{ label: "II", title: "The Seven Churches", at: 0 }],
    captions: [
      n(1.5, 6.5, "Seven letters, one to each of the seven churches which are in Asia, in the order the text gives them: from Ephesus round to Laodicea.", "The seven churches"),
    ],
  },
  {
    id: "churches", module: "churches", length: 111, enter: t("light", 1.5), years: null, covers: ["2-3"], creatures: ["sonOfMan", "crown", "elderSeat", "goldenVial", "keys"],
    captions: [
      ...letter(0,
        ["These things saith he that holdeth the seven stars in his right hand, who walketh in the midst of the seven golden candlesticks", "Revelation 2:1", "Unto the angel of the church of Ephesus"],
        ["I know thy works, and thy labour, and thy patience … thou hast left thy first love.", "Revelation 2:2–4"],
        ["or else I will come unto thee quickly, and will remove thy candlestick out of his place … thou hatest the deeds of the Nicolaitans", "Revelation 2:5–6"],
        ["To him that overcometh will I give to eat of the tree of life, which is in the midst of the paradise of God.", "Revelation 2:7"]),
      ...letter(1,
        ["These things saith the first and the last, which was dead, and is alive", "Revelation 2:8", "Unto the angel of the church in Smyrna"],
        ["I know thy works, and tribulation, and poverty, (but thou art rich)", "Revelation 2:9"],
        ["ye shall have tribulation ten days: be thou faithful unto death, and I will give thee a crown of life.", "Revelation 2:10"],
        ["He that overcometh shall not be hurt of the second death.", "Revelation 2:11"]),
      ...letter(2,
        ["These things saith he which hath the sharp sword with two edges", "Revelation 2:12", "Unto the angel of the church in Pergamos"],
        ["where Satan’s seat is: and thou holdest fast my name … Antipas was my faithful martyr", "Revelation 2:13"],
        ["them that hold the doctrine of Balaam, who taught Balac to cast a stumblingblock before the children of Israel … the doctrine of the Nicolaitans", "Revelation 2:14–15"],
        ["To him that overcometh will I give to eat of the hidden manna, and will give him a white stone, and in the stone a new name written", "Revelation 2:17"]),
      ...letter(3,
        ["These things saith the Son of God, who hath his eyes like unto a flame of fire, and his feet are like fine brass", "Revelation 2:18", "Unto the angel of the church in Thyatira"],
        ["I know thy works, and charity, and service, and faith … thou sufferest that woman Jezebel, which calleth herself a prophetess", "Revelation 2:19–20"],
        ["to him will I give power over the nations: And he shall rule them with a rod of iron; as the vessels of a potter shall they be broken to shivers", "Revelation 2:26–27"],
        ["And I will give him the morning star.", "Revelation 2:28"]),
      ...letter(4,
        ["These things saith he that hath the seven Spirits of God, and the seven stars; I know thy works, that thou hast a name that thou livest, and art dead.", "Revelation 3:1", "Unto the angel of the church in Sardis"],
        ["If therefore thou shalt not watch, I will come on thee as a thief", "Revelation 3:3"],
        ["Thou hast a few names even in Sardis which have not defiled their garments; and they shall walk with me in white", "Revelation 3:4"],
        ["He that overcometh, the same shall be clothed in white raiment; and I will not blot out his name out of the book of life", "Revelation 3:5"]),
      ...letter(5,
        ["These things saith he that is holy, he that is true, he that hath the key of David, he that openeth, and no man shutteth", "Revelation 3:7", "Unto the angel of the church in Philadelphia"],
        ["behold, I have set before thee an open door, and no man can shut it", "Revelation 3:8"],
        ["I also will keep thee from the hour of temptation … hold that fast which thou hast, that no man take thy crown.", "Revelation 3:10–11"],
        ["Him that overcometh will I make a pillar in the temple of my God … the name of the city of my God, which is new Jerusalem", "Revelation 3:12"]),
      ...letter(6,
        ["These things saith the Amen, the faithful and true witness, the beginning of the creation of God", "Revelation 3:14", "Unto the angel of the church of the Laodiceans"],
        ["thou art neither cold nor hot … I will spue thee out of my mouth.", "Revelation 3:15–16"],
        ["I counsel thee to buy of me gold tried in the fire … and white raiment … and anoint thine eyes with eyesalve", "Revelation 3:18"],
        ["Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him", "Revelation 3:20"],
        ["To him that overcometh will I grant to sit with me in my throne", "Revelation 3:21"]),
    ],
  },
  // ---------------------------------------------------------------- III. The throne and the Lamb (4–5)
  {
    id: "door", module: "door", length: 36, enter: t("light", 1.5), years: null, covers: ["4"],
    creatures: ["elderSeat", "elder", "elderB", "elderC", "crown", "beastLion", "beastCalf", "beastMan", "beastEagle", "wingEyes"],
    acts: [{ label: "III", title: "The Throne and the Lamb", at: 0 }],
    captions: [
      v(1.5, 5, "After this I looked, and, behold, a door was opened in heaven: and the first voice which I heard was as it were of a trumpet talking with me; which said, Come up hither", "Revelation 4:1"),
      v(5.5, 9, "And immediately I was in the spirit: and, behold, a throne was set in heaven, and one sat on the throne.", "Revelation 4:2"),
      v(9.5, 13, "And he that sat was to look upon like a jasper and a sardine stone: and there was a rainbow round about the throne, in sight like unto an emerald.", "Revelation 4:3"),
      v(13.5, 17, "And round about the throne were four and twenty seats: and upon the seats I saw four and twenty elders sitting, clothed in white raiment; and they had on their heads crowns of gold.", "Revelation 4:4"),
      v(17.5, 21, "And out of the throne proceeded lightnings and thunderings and voices: and there were seven lamps of fire burning before the throne, which are the seven Spirits of God.", "Revelation 4:5"),
      v(21.5, 24.5, "And before the throne there was a sea of glass like unto crystal: and in the midst of the throne, and round about the throne, were four beasts full of eyes before and behind.", "Revelation 4:6"),
      v(25, 28, "And the first beast was like a lion, and the second beast like a calf, and the third beast had a face as a man, and the fourth beast was like a flying eagle.", "Revelation 4:7"),
      h(28.5, 31.5, "Holy, holy, holy, Lord God Almighty, which was, and is, and is to come.", "Revelation 4:8"),
      v(32, 35.5, "The four and twenty elders fall down before him that sat on the throne … and cast their crowns before the throne, saying, Thou art worthy, O Lord, to receive glory and honour and power", "Revelation 4:10–11"),
    ],
  },
  {
    id: "lamb", module: "lamb", length: 48, enter: t("light", 1), years: null, covers: ["5"],
    creatures: ["elderSeat", "elder", "elderB", "elderC", "crown", "beastLion", "beastCalf", "beastMan", "beastEagle", "wingEyes", "sealedBook", "angel", "lamb", "harp", "goldenVial"],
    captions: [
      v(1.5, 5, "And I saw in the right hand of him that sat on the throne a book written within and on the backside, sealed with seven seals.", "Revelation 5:1"),
      v(5.5, 9, "And I saw a strong angel proclaiming with a loud voice, Who is worthy to open the book, and to loose the seals thereof?", "Revelation 5:2"),
      v(9.5, 12.5, "And no man in heaven, nor in earth, neither under the earth, was able to open the book, neither to look thereon.", "Revelation 5:3"),
      v(13, 16, "And I wept much, because no man was found worthy to open and to read the book, neither to look thereon.", "Revelation 5:4"),
      v(16.5, 19.5, "And one of the elders saith unto me, Weep not: behold, the Lion of the tribe of Juda, the Root of David, hath prevailed to open the book", "Revelation 5:5"),
      v(20, 23.5, "And I beheld, and, lo, in the midst of the throne and of the four beasts, and in the midst of the elders, stood a Lamb as it had been slain, having seven horns and seven eyes", "Revelation 5:6"),
      v(24, 26.5, "And he came and took the book out of the right hand of him that sat upon the throne.", "Revelation 5:7"),
      v(27, 30, "the four beasts and four and twenty elders fell down before the Lamb, having every one of them harps, and golden vials full of odours, which are the prayers of saints.", "Revelation 5:8"),
      v(30.5, 33.5, "And they sung a new song, saying, Thou art worthy to take the book, and to open the seals thereof: for thou wast slain", "Revelation 5:9"),
      v(34, 37, "And I beheld, and I heard the voice of many angels round about the throne … and the number of them was ten thousand times ten thousand, and thousands of thousands", "Revelation 5:11"),
      h(37.5, 40.5, "Worthy is the Lamb that was slain", "Revelation 5:12"),
      v(41, 44.5, "And every creature which is in heaven, and on the earth, and under the earth, and such as are in the sea … Blessing, and honour, and glory, and power, be unto him that sitteth upon the throne, and unto the Lamb for ever and ever.", "Revelation 5:13"),
      v(45, 47.5, "And the four beasts said, Amen. And the four and twenty elders fell down and worshipped him that liveth for ever and ever.", "Revelation 5:14"),
    ],
  },
];

export const { LENGTH, ACTS, CAPTIONS, TRANSITIONS, locate, yearAt } = layout(SCENES);
export { envelope };
