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
export const BUILT = 11;

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

/** Who the throne room (kit/heaven.js) always shows: the elders and their crowns, and the four beasts. */
const ROOM_CAST = ["elder", "elderB", "elderC", "crown", "beastLion", "beastCalf", "beastMan", "beastEagle"];

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
    id: "churches", module: "churches", length: 111, enter: t("light", 1.5), years: null, covers: ["2-3"], creatures: ["sonOfMan", "crown", "goldenVial", "keys"],
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
    creatures: ["elder", "elderB", "elderC", "crown", "beastLion", "beastCalf", "beastMan", "beastEagle"],
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
    creatures: ["elder", "elderB", "elderC", "crown", "beastLion", "beastCalf", "beastMan", "beastEagle", "sealedBook", "angel", "lamb", "harp", "goldenVial"],
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
  // ---------------------------------------------------------------- IV. The seven seals (6:1–8:6)
  {
    id: "horsemen", module: "horsemen", length: 60, enter: t("light", 1.5), years: null, covers: ["6:1-8"],
    creatures: [...ROOM_CAST, "lamb", "sealedBook", "horseWhite", "horseRed", "horseBlack", "horsePale"],
    acts: [{ label: "IV", title: "The Seven Seals", at: 0 }],
    captions: [
      v(1.5, 5.5, "And I saw when the Lamb opened one of the seals, and I heard, as it were the noise of thunder, one of the four beasts saying, Come and see.", "Revelation 6:1"),
      v(6, 11, "And I saw, and behold a white horse: and he that sat on him had a bow; and a crown was given unto him: and he went forth conquering, and to conquer.", "Revelation 6:2"),
      v(15, 18.5, "And when he had opened the second seal, I heard the second beast say, Come and see.", "Revelation 6:3"),
      v(19, 24, "And there went out another horse that was red: and power was given to him that sat thereon to take peace from the earth, and that they should kill one another: and there was given unto him a great sword.", "Revelation 6:4"),
      v(28, 32, "And when he had opened the third seal, I heard the third beast say, Come and see. And I beheld, and lo a black horse; and he that sat on him had a pair of balances in his hand.", "Revelation 6:5"),
      v(32.5, 37, "And I heard a voice in the midst of the four beasts say, A measure of wheat for a penny, and three measures of barley for a penny; and see thou hurt not the oil and the wine.", "Revelation 6:6"),
      v(41, 44.5, "And when he had opened the fourth seal, I heard the voice of the fourth beast say, Come and see.", "Revelation 6:7"),
      v(45, 50.5, "And I looked, and behold a pale horse: and his name that sat on him was Death, and Hell followed with him.", "Revelation 6:8"),
      v(51, 58.5, "And power was given unto them over the fourth part of the earth, to kill with sword, and with hunger, and with death, and with the beasts of the earth.", "Revelation 6:8"),
    ],
  },
  {
    id: "altar", module: "altar", length: 26, enter: t("dark", 1.5), years: null, covers: ["6:9-11"], creatures: [],
    captions: [
      v(1.5, 6, "And when he had opened the fifth seal, I saw under the altar the souls of them that were slain for the word of God, and for the testimony which they held", "Revelation 6:9"),
      v(6.5, 12, "And they cried with a loud voice, saying, How long, O Lord, holy and true, dost thou not judge and avenge our blood on them that dwell on the earth?", "Revelation 6:10"),
      v(12.5, 18.5, "And white robes were given unto every one of them; and it was said unto them, that they should rest yet for a little season", "Revelation 6:11"),
      v(19, 24.5, "until their fellowservants also and their brethren, that should be killed as they were, should be fulfilled.", "Revelation 6:11"),
    ],
  },
  {
    id: "sixthseal", module: "sixthseal", length: 44, enter: t("dark", 1.5), years: null, covers: ["6:12-17"], creatures: [],
    captions: [
      v(1.5, 6, "And I beheld when he had opened the sixth seal, and, lo, there was a great earthquake", "Revelation 6:12"),
      v(6.5, 11, "and the sun became black as sackcloth of hair, and the moon became as blood", "Revelation 6:12"),
      v(11.5, 16, "And the stars of heaven fell unto the earth, even as a fig tree casteth her untimely figs, when she is shaken of a mighty wind.", "Revelation 6:13"),
      v(16.5, 21, "And the heaven departed as a scroll when it is rolled together; and every mountain and island were moved out of their places.", "Revelation 6:14"),
      v(21.5, 28, "And the kings of the earth, and the great men, and the rich men, and the chief captains, and the mighty men, and every bondman, and every free man, hid themselves in the dens and in the rocks of the mountains", "Revelation 6:15"),
      v(28.5, 35, "And said to the mountains and rocks, Fall on us, and hide us from the face of him that sitteth on the throne, and from the wrath of the Lamb", "Revelation 6:16"),
      h(35.5, 42, "For the great day of his wrath is come; and who shall be able to stand?", "Revelation 6:17"),
    ],
  },
  {
    id: "sealing", module: "sealing", length: 45, enter: t("light", 1.5), years: null, covers: ["7:1-8"], creatures: ["angel"],
    captions: [
      v(1.5, 6.5, "And after these things I saw four angels standing on the four corners of the earth, holding the four winds of the earth, that the wind should not blow on the earth, nor on the sea, nor on any tree.", "Revelation 7:1"),
      v(7, 11.5, "And I saw another angel ascending from the east, having the seal of the living God: and he cried with a loud voice to the four angels", "Revelation 7:2"),
      v(12, 16.5, "Hurt not the earth, neither the sea, nor the trees, till we have sealed the servants of our God in their foreheads.", "Revelation 7:3"),
      v(17, 21.5, "And I heard the number of them which were sealed: and there were sealed an hundred and forty and four thousand of all the tribes of the children of Israel.", "Revelation 7:4"),
      v(22, 27, "Of the tribe of Juda were sealed twelve thousand. Of the tribe of Reuben were sealed twelve thousand. Of the tribe of Gad were sealed twelve thousand.", "Revelation 7:5"),
      v(27.5, 32.5, "Of the tribe of Aser were sealed twelve thousand. Of the tribe of Nepthalim were sealed twelve thousand. Of the tribe of Manasses were sealed twelve thousand.", "Revelation 7:6"),
      v(33, 38, "Of the tribe of Simeon were sealed twelve thousand. Of the tribe of Levi were sealed twelve thousand. Of the tribe of Issachar were sealed twelve thousand.", "Revelation 7:7"),
      v(38.5, 43.5, "Of the tribe of Zabulon were sealed twelve thousand. Of the tribe of Joseph were sealed twelve thousand. Of the tribe of Benjamin were sealed twelve thousand.", "Revelation 7:8"),
    ],
  },
  {
    id: "multitude", module: "multitude", length: 49, enter: t("light", 1.5), years: null, covers: ["7:9-17"],
    creatures: [...ROOM_CAST, "lamb", "angel"],
    captions: [
      v(1.5, 6.5, "After this I beheld, and, lo, a great multitude, which no man could number, of all nations, and kindreds, and people, and tongues, stood before the throne, and before the Lamb, clothed with white robes, and palms in their hands", "Revelation 7:9"),
      h(7, 11, "Salvation to our God which sitteth upon the throne, and unto the Lamb.", "Revelation 7:10"),
      v(11.5, 16.5, "And all the angels stood round about the throne, and about the elders and the four beasts, and fell before the throne on their faces, and worshipped God", "Revelation 7:11"),
      v(17, 21, "Saying, Amen: Blessing, and glory, and wisdom, and thanksgiving, and honour, and power, and might, be unto our God for ever and ever. Amen.", "Revelation 7:12"),
      v(21.5, 25.5, "And one of the elders answered, saying unto me, What are these which are arrayed in white robes? and whence came they?", "Revelation 7:13"),
      v(26, 29.5, "And I said unto him, Sir, thou knowest.", "Revelation 7:14"),
      v(30, 35, "These are they which came out of great tribulation, and have washed their robes, and made them white in the blood of the Lamb.", "Revelation 7:14"),
      v(35.5, 39.5, "Therefore are they before the throne of God, and serve him day and night in his temple: and he that sitteth on the throne shall dwell among them.", "Revelation 7:15"),
      v(40, 43.5, "They shall hunger no more, neither thirst any more; neither shall the sun light on them, nor any heat.", "Revelation 7:16"),
      v(44, 48, "For the Lamb which is in the midst of the throne shall feed them, and shall lead them unto living fountains of waters: and God shall wipe away all tears from their eyes.", "Revelation 7:17"),
    ],
  },
  {
    // the half hour of silence (8:1) is designed: no sound, almost no motion, and no caption for a long stretch
    id: "censer", module: "censer", length: 46, enter: t("light", 1.5), years: null, covers: ["8:1-6"],
    creatures: [...ROOM_CAST, "angel"],
    captions: [
      h(1.5, 5, "And when he had opened the seventh seal, there was silence in heaven about the space of half an hour.", "Revelation 8:1"),
      v(20.5, 24.5, "And I saw the seven angels which stood before God; and to them were given seven trumpets.", "Revelation 8:2"),
      v(25, 30, "And another angel came and stood at the altar, having a golden censer; and there was given unto him much incense, that he should offer it with the prayers of all saints upon the golden altar which was before the throne.", "Revelation 8:3"),
      v(30.5, 34, "And the smoke of the incense, which came with the prayers of the saints, ascended up before God out of the angel’s hand.", "Revelation 8:4"),
      v(34.5, 39.5, "And the angel took the censer, and filled it with fire of the altar, and cast it into the earth: and there were voices, and thunderings, and lightnings, and an earthquake.", "Revelation 8:5"),
      v(40, 44.5, "And the seven angels which had the seven trumpets prepared themselves to sound.", "Revelation 8:6"),
    ],
  },
  // ---------------------------------------------------------------- V. The seven trumpets (8:7–11:19)
  {
    id: "trumpets", module: "trumpets", length: 66, enter: t("dark", 1.5), years: null, covers: ["8:7-13"], creatures: ["angel"],
    acts: [{ label: "V", title: "The Seven Trumpets", at: 0 }],
    captions: [
      v(1.5, 6.5, "The first angel sounded, and there followed hail and fire mingled with blood, and they were cast upon the earth", "Revelation 8:7"),
      v(7, 11.5, "and the third part of trees was burnt up, and all green grass was burnt up.", "Revelation 8:7"),
      v(13, 18, "And the second angel sounded, and as it were a great mountain burning with fire was cast into the sea: and the third part of the sea became blood", "Revelation 8:8"),
      v(18.5, 23.5, "And the third part of the creatures which were in the sea, and had life, died; and the third part of the ships were destroyed.", "Revelation 8:9"),
      v(25, 30, "And the third angel sounded, and there fell a great star from heaven, burning as it were a lamp, and it fell upon the third part of the rivers, and upon the fountains of waters", "Revelation 8:10"),
      v(30.5, 36, "And the name of the star is called Wormwood: and the third part of the waters became wormwood; and many men died of the waters, because they were made bitter.", "Revelation 8:11"),
      v(38, 43.5, "And the fourth angel sounded, and the third part of the sun was smitten, and the third part of the moon, and the third part of the stars", "Revelation 8:12"),
      v(44, 49.5, "so as the third part of them was darkened, and the day shone not for a third part of it, and the night likewise.", "Revelation 8:12"),
      v(51.5, 56.5, "And I beheld, and heard an angel flying through the midst of heaven, saying with a loud voice", "Revelation 8:13"),
      h(57, 60.5, "Woe, woe, woe, to the inhabiters of the earth", "Revelation 8:13"),
      v(61, 65, "by reason of the other voices of the trumpet of the three angels, which are yet to sound!", "Revelation 8:13"),
    ],
  },
  {
    id: "pit", module: "pit", length: 60, enter: t("dark", 1.5), years: null, covers: ["9:1-12"], creatures: ["keys", "locust", "abaddon"],
    captions: [
      v(1.5, 6, "And the fifth angel sounded, and I saw a star fall from heaven unto the earth: and to him was given the key of the bottomless pit.", "Revelation 9:1"),
      v(6.5, 11.5, "And he opened the bottomless pit; and there arose a smoke out of the pit, as the smoke of a great furnace; and the sun and the air were darkened by reason of the smoke of the pit.", "Revelation 9:2"),
      v(12, 16, "And there came out of the smoke locusts upon the earth: and unto them was given power, as the scorpions of the earth have power.", "Revelation 9:3"),
      v(16.5, 21.5, "And it was commanded them that they should not hurt the grass of the earth, neither any green thing, neither any tree; but only those men which have not the seal of God in their foreheads.", "Revelation 9:4"),
      v(22, 26.5, "And to them it was given that they should not kill them, but that they should be tormented five months: and their torment was as the torment of a scorpion, when he striketh a man.", "Revelation 9:5"),
      v(27, 31, "And in those days shall men seek death, and shall not find it; and shall desire to die, and death shall flee from them.", "Revelation 9:6"),
      v(31.5, 36, "And the shapes of the locusts were like unto horses prepared unto battle; and on their heads were as it were crowns like gold, and their faces were as the faces of men.", "Revelation 9:7"),
      v(36.5, 40, "And they had hair as the hair of women, and their teeth were as the teeth of lions.", "Revelation 9:8"),
      v(40.5, 45, "And they had breastplates, as it were breastplates of iron; and the sound of their wings was as the sound of chariots of many horses running to battle.", "Revelation 9:9"),
      v(45.5, 49, "And they had tails like unto scorpions, and there were stings in their tails: and their power was to hurt men five months.", "Revelation 9:10"),
      v(49.5, 55, "And they had a king over them, which is the angel of the bottomless pit, whose name in the Hebrew tongue is Abaddon, but in the Greek tongue hath his name Apollyon.", "Revelation 9:11"),
      h(55.5, 59, "One woe is past; and, behold, there come two woes more hereafter.", "Revelation 9:12"),
    ],
  },
  {
    id: "euphrates", module: "euphrates", length: 49, enter: t("dark", 1.5), years: null, covers: ["9:13-21"], creatures: ["angel", "lionHorse", "idol"],
    captions: [
      v(1.5, 5.5, "And the sixth angel sounded, and I heard a voice from the four horns of the golden altar which is before God", "Revelation 9:13"),
      v(6, 9.5, "Saying to the sixth angel which had the trumpet, Loose the four angels which are bound in the great river Euphrates.", "Revelation 9:14"),
      v(10, 15, "And the four angels were loosed, which were prepared for an hour, and a day, and a month, and a year, for to slay the third part of men.", "Revelation 9:15"),
      v(15.5, 19.5, "And the number of the army of the horsemen were two hundred thousand thousand: and I heard the number of them.", "Revelation 9:16"),
      v(20, 25.5, "And thus I saw the horses in the vision, and them that sat on them, having breastplates of fire, and of jacinth, and brimstone: and the heads of the horses were as the heads of lions; and out of their mouths issued fire and smoke and brimstone.", "Revelation 9:17"),
      v(26, 30, "By these three was the third part of men killed, by the fire, and by the smoke, and by the brimstone, which issued out of their mouths.", "Revelation 9:18"),
      v(30.5, 34.5, "For their power is in their mouth, and in their tails: for their tails were like unto serpents, and had heads, and with them they do hurt.", "Revelation 9:19"),
      v(35, 42, "And the rest of the men which were not killed by these plagues yet repented not of the works of their hands, that they should not worship devils, and idols of gold, and silver, and brass, and stone, and of wood: which neither can see, nor hear, nor walk", "Revelation 9:20"),
      v(42.5, 47.5, "Neither repented they of their murders, nor of their sorceries, nor of their fornication, nor of their thefts.", "Revelation 9:21"),
    ],
  },
  {
    id: "littlebook", module: "littlebook", length: 56, enter: t("light", 1.5), years: null, covers: ["10"], creatures: ["angel"],
    captions: [
      v(1.5, 6.5, "And I saw another mighty angel come down from heaven, clothed with a cloud: and a rainbow was upon his head, and his face was as it were the sun, and his feet as pillars of fire", "Revelation 10:1"),
      v(7, 11, "And he had in his hand a little book open: and he set his right foot upon the sea, and his left foot on the earth", "Revelation 10:2"),
      v(11.5, 15.5, "And cried with a loud voice, as when a lion roareth: and when he had cried, seven thunders uttered their voices.", "Revelation 10:3"),
      v(20.5, 25, "I was about to write: and I heard a voice from heaven saying unto me, Seal up those things which the seven thunders uttered, and write them not.", "Revelation 10:4"),
      v(25.5, 30.5, "And the angel which I saw stand upon the sea and upon the earth lifted up his hand to heaven, And sware by him that liveth for ever and ever … that there should be time no longer", "Revelation 10:5–6"),
      v(31, 35, "But in the days of the voice of the seventh angel, when he shall begin to sound, the mystery of God should be finished, as he hath declared to his servants the prophets.", "Revelation 10:7"),
      v(35.5, 40, "Go and take the little book which is open in the hand of the angel which standeth upon the sea and upon the earth.", "Revelation 10:8"),
      v(40.5, 44.5, "And I went unto the angel, and said unto him, Give me the little book. And he said unto me, Take it, and eat it up", "Revelation 10:9"),
      v(45, 50, "And I took the little book out of the angel’s hand, and ate it up; and it was in my mouth sweet as honey: and as soon as I had eaten it, my belly was bitter.", "Revelation 10:10"),
      v(50.5, 55, "Thou must prophesy again before many peoples, and nations, and tongues, and kings.", "Revelation 10:11"),
    ],
  },
  {
    id: "witnesses", module: "witnesses", length: 72, enter: t("light", 1.5), years: null, covers: ["11:1-14"], creatures: ["angel", "witness", "witnessB"],
    captions: [
      v(1.5, 6, "And there was given me a reed like unto a rod: and the angel stood, saying, Rise, and measure the temple of God, and the altar, and them that worship therein.", "Revelation 11:1"),
      v(6.5, 11, "But the court which is without the temple leave out, and measure it not; for it is given unto the Gentiles: and the holy city shall they tread under foot forty and two months.", "Revelation 11:2"),
      v(11.5, 16, "And I will give power unto my two witnesses, and they shall prophesy a thousand two hundred and threescore days, clothed in sackcloth.", "Revelation 11:3"),
      v(16.5, 20, "These are the two olive trees, and the two candlesticks standing before the God of the earth.", "Revelation 11:4"),
      v(20.5, 24.5, "And if any man will hurt them, fire proceedeth out of their mouth, and devoureth their enemies", "Revelation 11:5"),
      v(25, 30, "These have power to shut heaven, that it rain not in the days of their prophecy: and have power over waters to turn them to blood, and to smite the earth with all plagues, as often as they will.", "Revelation 11:6"),
      v(30.5, 35, "And when they shall have finished their testimony, the beast that ascendeth out of the bottomless pit shall make war against them, and shall overcome them, and kill them.", "Revelation 11:7"),
      v(35.5, 40, "And their dead bodies shall lie in the street of the great city, which spiritually is called Sodom and Egypt, where also our Lord was crucified.", "Revelation 11:8"),
      v(40.5, 45.5, "And they of the people and kindreds and tongues and nations shall see their dead bodies three days and an half, and shall not suffer their dead bodies to be put in graves.", "Revelation 11:9"),
      v(46, 50.5, "And they that dwell upon the earth shall rejoice over them, and make merry, and shall send gifts one to another", "Revelation 11:10"),
      v(51, 55.5, "And after three days and an half the Spirit of life from God entered into them, and they stood upon their feet; and great fear fell upon them which saw them.", "Revelation 11:11"),
      v(56, 60.5, "And they heard a great voice from heaven saying unto them, Come up hither. And they ascended up to heaven in a cloud; and their enemies beheld them.", "Revelation 11:12"),
      v(61, 66, "And the same hour was there a great earthquake, and the tenth part of the city fell, and in the earthquake were slain of men seven thousand: and the remnant were affrighted, and gave glory to the God of heaven.", "Revelation 11:13"),
      h(66.5, 70.5, "The second woe is past; and, behold, the third woe cometh quickly.", "Revelation 11:14"),
    ],
  },
  {
    id: "seventh", module: "seventh", length: 31, enter: t("light", 1.5), years: null, covers: ["11:15-19"], creatures: [...ROOM_CAST],
    captions: [
      v(1.5, 5, "And the seventh angel sounded; and there were great voices in heaven, saying", "Revelation 11:15"),
      h(5.5, 10, "The kingdoms of this world are become the kingdoms of our Lord, and of his Christ; and he shall reign for ever and ever.", "Revelation 11:15"),
      v(10.5, 15, "And the four and twenty elders, which sat before God on their seats, fell upon their faces, and worshipped God, Saying, We give thee thanks, O Lord God Almighty, which art, and wast, and art to come", "Revelation 11:16–17"),
      v(15.5, 20.5, "And the nations were angry, and thy wrath is come, and the time of the dead, that they should be judged, and that thou shouldest give reward unto thy servants the prophets, and to the saints", "Revelation 11:18"),
      v(21, 25.5, "And the temple of God was opened in heaven, and there was seen in his temple the ark of his testament", "Revelation 11:19"),
      v(26, 30, "and there were lightnings, and voices, and thunderings, and an earthquake, and great hail.", "Revelation 11:19"),
    ],
  },
];

export const { LENGTH, ACTS, CAPTIONS, TRANSITIONS, locate, yearAt } = layout(SCENES);
export { envelope };
