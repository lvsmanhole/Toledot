// The whole journey, Genesis to Revelation, as an ordered list of scenes on one scroll axis.
// Scripture is quoted from the King James Version (1611; the 1769 standard text as published by
// eBible.org, Apocrypha included). Excerpts use "…" where words are left out; tests check every
// caption against the KJV text. Years are astronomical (1 BCE = 0) and follow the Toledot chronology
// (site/data), so the in-scene timeline and the Toledot timeline agree.

export const UNIT_VH = 18;

const L = { light: [1, 0.97, 0.9], white: [0.95, 0.95, 0.95], dark: [0, 0, 0], dust: [0.72, 0.6, 0.45], ash: [0.18, 0.16, 0.15], water: [0.05, 0.12, 0.16], fire: [0.9, 0.45, 0.12], night: [0.02, 0.03, 0.05], gold: [0.95, 0.78, 0.45] };
const t = (kind, width = 2) => ({ kind: kind === "cloud" ? "cloud" : "fade", color: L[kind] ?? L.dark, width });

// caption helpers: v = verse, h = monumental title, n = note (no scripture)
const v = (from, to, text, ref, kicker) => ({ from, to, style: "verse", text, ref, kicker });
const h = (from, to, text, ref, note) => ({ from, to, style: "title", text, ref, note });
const n = (from, to, text, kicker) => ({ from, to, style: "note", text, kicker });

export const SCENES = [
  // ---------------------------------------------------------------- Prologue and Creation
  {
    id: "cosmos", module: "cosmos", length: 26, enter: null, years: null,
    acts: [{ label: "Prologue", title: "Before the World", at: 0 }, { label: "Act I", title: "Creation", at: 16 }],
    captions: [
      h(2.5, 8, "In the beginning", "Genesis 1:1"),
      h(8.5, 14, "God created the heaven and the earth", "Genesis 1:1"),
      v(14.5, 19.5, "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.", "Genesis 1:2"),
      h(20, 24.5, "Let there be light", "Genesis 1:3"),
    ],
  },
  {
    id: "earth", module: "earth", length: 24, enter: t("light", 2.2), years: null,
    captions: [
      v(2, 6, "Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.", "Genesis 1:6", "The second day"),
      v(6.5, 10.5, "Let the waters under the heaven be gathered together unto one place, and let the dry land appear", "Genesis 1:9", "The third day"),
      v(11, 14.5, "Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind", "Genesis 1:11"),
      v(15, 18, "Let there be lights in the firmament of the heaven to divide the day from the night", "Genesis 1:14", "The fourth day"),
      v(18.5, 21.5, "Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth", "Genesis 1:20", "The fifth day"),
    ],
  },
  {
    id: "eden", module: "eden", length: 50, enter: t("cloud", 3), years: [[0, -5507], [50, -5480]],
    chronicle: { chapters: ["genesis:1-4"], span: 400 },
    acts: [{ label: "Act I", title: "Eden", at: 2 }, { label: "Act II", title: "The Fall", at: 24 }],
    captions: [
      v(2.5, 7, "And the LORD God planted a garden eastward in Eden; and there he put the man whom he had formed.", "Genesis 2:8", "The garden"),
      v(7.5, 12, "And a river went out of Eden to water the garden", "Genesis 2:10"),
      v(12.5, 17.5, "the tree of life also in the midst of the garden, and the tree of knowledge of good and evil.", "Genesis 2:9"),
      v(18, 22.5, "And God saw every thing that he had made, and, behold, it was very good.", "Genesis 1:31"),
      v(25, 29, "Now the serpent was more subtil than any beast of the field which the LORD God had made.", "Genesis 3:1", "The Fall"),
      v(29.5, 34, "she took of the fruit thereof, and did eat, and gave also unto her husband with her; and he did eat.", "Genesis 3:6"),
      v(34.5, 39, "for dust thou art, and unto dust shalt thou return.", "Genesis 3:19"),
      v(39.5, 45, "he placed at the east of the garden of Eden Cherubims, and a flaming sword which turned every way, to keep the way of the tree of life.", "Genesis 3:24"),
      h(45.3, 48.6, "The lineage of promise", "Luke 3:38", "Adam: the first strand of a line that runs through Seth, Noah, Abraham and David to Christ."),
    ],
  },
  // ---------------------------------------------------------------- Act III
  {
    id: "cain", module: "cain", length: 30, enter: t("night", 2.4), years: [[0, -5480], [12, -5380], [22, -4300], [30, -3866]],
    chronicle: { chapters: ["genesis:4-5"], span: 500 },
    acts: [{ label: "Act III", title: "Cain, Abel & Early Humanity", at: 0 }],
    captions: [
      v(2, 6, "And Abel, he also brought of the firstlings of his flock and of the fat thereof.", "Genesis 4:4"),
      v(6.5, 10.5, "But unto Cain and to his offering he had not respect. And Cain was very wroth, and his countenance fell.", "Genesis 4:5"),
      v(11, 14.5, "the voice of thy brother’s blood crieth unto me from the ground.", "Genesis 4:10"),
      v(15, 18.5, "and he builded a city, and called the name of the city, after the name of his son, Enoch.", "Genesis 4:17"),
      v(19, 22.5, "then began men to call upon the name of the LORD.", "Genesis 4:26"),
      v(23, 27.5, "And Enoch walked with God: and he was not; for God took him.", "Genesis 5:24"),
    ],
  },
  // ---------------------------------------------------------------- Act IV
  {
    id: "flood", module: "flood", length: 52, enter: t("dust", 2), years: [[0, -3385], [14, -3266], [20, -3265], [44, -3265], [52, -3264]],
    chronicle: { chapters: ["genesis:6-9"], span: 400 },
    acts: [{ label: "Act IV", title: "The Flood", at: 0 }],
    captions: [
      v(2, 6, "And GOD saw that the wickedness of man was great in the earth", "Genesis 6:5"),
      v(6.5, 10, "But Noah found grace in the eyes of the LORD.", "Genesis 6:8"),
      v(10.5, 14.5, "Make thee an ark of gopher wood; rooms shalt thou make in the ark, and shalt pitch it within and without with pitch.", "Genesis 6:14"),
      v(15, 18.5, "And they that went in, went in male and female of all flesh, as God had commanded him: and the LORD shut him in.", "Genesis 7:16"),
      v(19, 23.5, "the same day were all the fountains of the great deep broken up, and the windows of heaven were opened.", "Genesis 7:11"),
      v(24, 28, "And the rain was upon the earth forty days and forty nights.", "Genesis 7:12"),
      v(28.5, 33, "and all the high hills, that were under the whole heaven, were covered.", "Genesis 7:19"),
      v(34, 38, "And God remembered Noah … and God made a wind to pass over the earth, and the waters asswaged", "Genesis 8:1"),
      v(38.5, 42, "and, lo, in her mouth was an olive leaf pluckt off", "Genesis 8:11"),
      v(42.5, 46, "And the ark rested in the seventh month … upon the mountains of Ararat.", "Genesis 8:4"),
      v(46.5, 50.5, "I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth.", "Genesis 9:13"),
    ],
  },
  // ---------------------------------------------------------------- Act V
  {
    id: "babel", module: "babel", length: 24, enter: t("light", 2), years: [[0, -2760], [24, -2734]],
    chronicle: { chapters: ["genesis:10-11"], span: 400 },
    acts: [{ label: "Act V", title: "Babel & the Nations", at: 0 }],
    captions: [
      v(2, 5.5, "And the whole earth was of one language, and of one speech.", "Genesis 11:1"),
      v(6, 11, "let us build us a city and a tower, whose top may reach unto heaven; and let us make us a name", "Genesis 11:4"),
      { ...v(12, 16, "Go to, let us go down, and there confound their language, that they may not understand one another’s speech.", "Genesis 11:7"), fracture: true },
      v(17, 22, "Therefore is the name of it called Babel; because the LORD did there confound the language of all the earth", "Genesis 11:9"),
    ],
  },
  {
    id: "nations", module: "maps", program: "nations", length: 14, enter: t("dust", 2), years: [[0, -2734], [14, -2700]],
    chronicle: { chapters: ["genesis:10-11"], span: 600 },
    captions: [
      v(2, 7, "and by these were the nations divided in the earth after the flood.", "Genesis 10:32"),
      v(7.5, 12, "for in his days was the earth divided", "Genesis 10:25"),
    ],
  },
  // ---------------------------------------------------------------- Act VI
  {
    id: "abraham", module: "maps", program: "abraham", length: 22, enter: t("dark", 2), years: [[0, -2133], [4, -2058], [16, -2056], [22, -2048]],
    chronicle: { chapters: ["genesis:11-15"], span: 300 },
    acts: [{ label: "Act VI", title: "Abraham", at: 0 }],
    captions: [
      v(1.5, 5.5, "Get thee out of thy country, and from thy kindred, and from thy father’s house, unto a land that I will shew thee", "Genesis 12:1"),
      v(6, 10, "And I will make of thee a great nation, and I will bless thee, and make thy name great", "Genesis 12:2"),
      v(10.5, 14.5, "and Abram was seventy and five years old when he departed out of Haran.", "Genesis 12:4"),
      v(15, 20, "And Melchizedek king of Salem brought forth bread and wine: and he was the priest of the most high God.", "Genesis 14:18"),
    ],
  },
  {
    id: "promise", module: "promise", length: 18, enter: t("night", 2), years: [[0, -2048], [18, -2047]],
    chronicle: { chapters: ["genesis:15-21"], span: 300 },
    captions: [
      h(2, 7.5, "Look now toward heaven, and tell the stars", "Genesis 15:5"),
      v(8, 12, "if thou be able to number them: and he said unto him, So shall thy seed be.", "Genesis 15:5"),
      v(12.5, 16.5, "And he believed in the LORD; and he counted it to him for righteousness.", "Genesis 15:6"),
    ],
  },
  {
    id: "sodom", module: "sodom", length: 10, enter: t("night", 1.6), years: [[0, -2034], [10, -2034]],
    chronicle: { chapters: ["genesis:18-19"], span: 300 },
    captions: [
      v(2, 8, "and, lo, the smoke of the country went up as the smoke of a furnace.", "Genesis 19:28"),
    ],
  },
  {
    id: "moriah", module: "moriah", length: 20, enter: t("light", 2), years: [[0, -2008], [20, -2008]],
    chronicle: { chapters: ["genesis:21-25"], span: 300 },
    captions: [
      v(2, 6.5, "Take now thy son, thine only son Isaac, whom thou lovest, and get thee into the land of Moriah", "Genesis 22:2"),
      v(7, 11.5, "My son, God will provide himself a lamb for a burnt offering: so they went both of them together.", "Genesis 22:8"),
      v(12, 15.5, "and behold behind him a ram caught in a thicket by his horns", "Genesis 22:13"),
      v(16, 18.8, "In the mount of the LORD it shall be seen.", "Genesis 22:14"),
    ],
  },
  // ---------------------------------------------------------------- Act VII
  {
    id: "bethel", module: "bethel", length: 20, enter: t("night", 2), years: [[0, -1896], [20, -1896]],
    chronicle: { chapters: ["genesis:25-28"], span: 300 },
    acts: [{ label: "Act VII", title: "Isaac, Jacob & the Twelve", at: 0 }],
    captions: [
      v(2.5, 7.5, "and behold a ladder set up on the earth, and the top of it reached to heaven: and behold the angels of God ascending and descending on it.", "Genesis 28:12"),
      v(10, 14, "Surely the LORD is in this place; and I knew it not.", "Genesis 28:16"),
      v(14.5, 18.5, "this is none other but the house of God, and this is the gate of heaven.", "Genesis 28:17"),
    ],
  },
  {
    id: "peniel", module: "peniel", length: 12, enter: t("night", 1.6), years: [[0, -1876], [12, -1876]],
    chronicle: { chapters: ["genesis:29-33"], span: 300 },
    captions: [
      v(2, 6, "And Jacob was left alone; and there wrestled a man with him until the breaking of the day.", "Genesis 32:24"),
      v(6.5, 10.5, "Thy name shall be called no more Jacob, but Israel", "Genesis 32:28"),
    ],
  },
  {
    id: "tribes", module: "tribes", length: 12, enter: t("dark", 1.6), years: [[0, -1868], [12, -1866]],
    chronicle: { chapters: ["genesis:35", "genesis:49"], span: 300 },
    captions: [
      v(1.5, 5, "Now the sons of Jacob were twelve", "Genesis 35:22"),
      v(5.5, 10.5, "The sceptre shall not depart from Judah, nor a lawgiver from between his feet, until Shiloh come", "Genesis 49:10"),
    ],
  },
  // ---------------------------------------------------------------- Act VIII
  {
    id: "joseph", module: "joseph", length: 14, enter: t("dust", 2), years: [[0, -1865], [14, -1865]],
    chronicle: { chapters: ["genesis:37"], span: 200 },
    acts: [{ label: "Act VIII", title: "Joseph & Egypt", at: 0 }],
    captions: [
      v(1.5, 4.5, "and he made him a coat of many colours.", "Genesis 37:3"),
      v(5, 8.5, "and cast him into a pit: and the pit was empty, there was no water in it.", "Genesis 37:24"),
      v(9, 12.5, "and sold Joseph to the Ishmeelites for twenty pieces of silver: and they brought Joseph into Egypt.", "Genesis 37:28"),
    ],
  },
  {
    id: "egypt", module: "egypt", length: 30, enter: t("dust", 2), years: [[0, -1865], [10, -1852], [22, -1843], [30, -1826]],
    chronicle: { chapters: ["genesis:39-50"], span: 200 },
    captions: [
      v(2, 6, "See, I have set thee over all the land of Egypt.", "Genesis 41:41"),
      v(6.5, 11.5, "And all countries came into Egypt to Joseph for to buy corn; because that the famine was so sore in all lands.", "Genesis 41:57"),
      v(12, 17, "I am Joseph your brother, whom ye sold into Egypt.", "Genesis 45:4"),
      v(18, 24, "ye thought evil against me; but God meant it unto good … to save much people alive.", "Genesis 50:20"),
    ],
  },
  // ---------------------------------------------------------------- Act IX
  {
    id: "bondage", module: "bondage", length: 22, enter: t("dust", 2), years: [[0, -1772], [9, -1600], [16, -1530], [22, -1529]],
    chronicle: { chapters: ["exodus:1-2"], span: 300 },
    acts: [{ label: "Act IX", title: "Israel in Bondage", at: 0 }],
    captions: [
      v(2, 5.5, "Now there arose up a new king over Egypt, which knew not Joseph.", "Exodus 1:8"),
      v(6, 9.5, "And the Egyptians made the children of Israel to serve with rigour", "Exodus 1:13"),
      v(10, 14.5, "and they cried, and their cry came up unto God by reason of the bondage.", "Exodus 2:23"),
      v(15, 20, "she took for him an ark of bulrushes … and she laid it in the flags by the river’s brink.", "Exodus 2:3"),
    ],
  },
  // ---------------------------------------------------------------- Act X
  {
    id: "bush", module: "bush", length: 16, enter: t("night", 2), years: [[0, -1450], [16, -1450]],
    chronicle: { chapters: ["exodus:2-4"], span: 200 },
    acts: [{ label: "Act X", title: "Moses & the Exodus", at: 0 }],
    captions: [
      v(2, 6.5, "and, behold, the bush burned with fire, and the bush was not consumed.", "Exodus 3:2"),
      v(7, 10.5, "put off thy shoes from off thy feet, for the place whereon thou standest is holy ground.", "Exodus 3:5"),
      h(11, 15, "I AM THAT I AM", "Exodus 3:14"),
    ],
  },
  {
    id: "plagues", module: "plagues", length: 40, enter: t("dark", 2), years: [[0, -1450], [40, -1449]],
    chronicle: { chapters: ["exodus:5-12"], span: 200 },
    captions: [
      v(1.5, 4, "Let my people go, that they may hold a feast unto me in the wilderness.", "Exodus 5:1"),
      v(4.2, 7, "and all the waters that were in the river were turned to blood.", "Exodus 7:20", "Blood"),
      v(7.2, 9.6, "and the frogs came up, and covered the land of Egypt.", "Exodus 8:6", "Frogs"),
      v(9.8, 12.2, "all the dust of the land became lice throughout all the land of Egypt.", "Exodus 8:17", "Lice"),
      v(12.4, 14.8, "and there came a grievous swarm of flies into the house of Pharaoh", "Exodus 8:24", "Flies"),
      v(15, 17.4, "and all the cattle of Egypt died", "Exodus 9:6", "Livestock"),
      v(17.6, 20, "and it became a boil breaking forth with blains upon man, and upon beast.", "Exodus 9:10", "Boils"),
      v(20.2, 23, "So there was hail, and fire mingled with the hail, very grievous", "Exodus 9:24", "Hail"),
      v(23.2, 26, "And the locusts went up over all the land of Egypt", "Exodus 10:14", "Locusts"),
      { ...v(26.4, 30.5, "They saw not one another … but all the children of Israel had light in their dwellings.", "Exodus 10:23", "Darkness"), dark: true },
      v(31, 34.5, "and when I see the blood, I will pass over you", "Exodus 12:13", "The Passover"),
      v(35, 38.5, "And it came to pass, that at midnight the LORD smote all the firstborn in the land of Egypt", "Exodus 12:29", "The firstborn"),
    ],
  },
  {
    id: "redsea", module: "redsea", length: 30, enter: t("night", 2), years: [[0, -1449], [30, -1449]],
    chronicle: { chapters: ["exodus:13-15"], span: 200 },
    captions: [
      v(1.5, 5.5, "And the LORD went before them by day in a pillar of a cloud … and by night in a pillar of fire", "Exodus 13:21"),
      v(6, 10, "Fear ye not, stand still, and see the salvation of the LORD", "Exodus 14:13"),
      v(10.5, 14.5, "and the LORD caused the sea to go back by a strong east wind all that night, and made the sea dry land", "Exodus 14:21"),
      v(15, 20, "and the waters were a wall unto them on their right hand, and on their left.", "Exodus 14:22"),
      v(21, 25, "And the waters returned, and covered the chariots, and the horsemen", "Exodus 14:28"),
      v(25.5, 28.5, "I will sing unto the LORD, for he hath triumphed gloriously", "Exodus 15:1"),
    ],
  },
  // ---------------------------------------------------------------- Act XI
  {
    id: "sinai", module: "sinai", length: 34, enter: t("dust", 2), years: [[0, -1449], [24, -1448], [34, -1446]],
    chronicle: { chapters: ["exodus:16-40", "numbers:1-14"], span: 200 },
    acts: [{ label: "Act XI", title: "Sinai & the Wilderness", at: 0 }],
    captions: [
      v(2, 7, "there were thunders and lightnings, and a thick cloud upon the mount, and the voice of the trumpet exceeding loud", "Exodus 19:16"),
      v(7.5, 12, "And mount Sinai was altogether on a smoke, because the LORD descended upon it in fire", "Exodus 19:18"),
      h(12.5, 16.5, "Thou shalt have no other gods before me", "Exodus 20:3"),
      v(17, 20.5, "These be thy gods, O Israel, which brought thee up out of the land of Egypt.", "Exodus 32:4"),
      v(21, 24.5, "Then a cloud covered the tent of the congregation, and the glory of the LORD filled the tabernacle.", "Exodus 40:34"),
      v(25, 28.5, "It is manna: for they wist not what it was.", "Exodus 16:15"),
      v(29, 32.5, "And your children shall wander in the wilderness forty years", "Numbers 14:33"),
    ],
  },
  {
    id: "wilderness", module: "maps", program: "wilderness", length: 14, enter: t("dark", 2), years: [[0, -1446], [10, -1410], [14, -1409]],
    chronicle: { chapters: ["numbers:20-36", "deuteronomy:34"], span: 200 },
    captions: [
      v(8, 12.5, "This is the land which I sware unto Abraham, unto Isaac, and unto Jacob", "Deuteronomy 34:4"),
    ],
  },
  // ---------------------------------------------------------------- Act XII
  {
    id: "jordan", module: "jordan", length: 12, enter: t("light", 2), years: [[0, -1409], [12, -1409]],
    chronicle: { chapters: ["joshua:1-5"], span: 200 },
    acts: [{ label: "Act XII", title: "Joshua & the Land", at: 0 }],
    captions: [
      v(1.5, 5, "Be strong and of a good courage; be not afraid", "Joshua 1:9"),
      v(5.5, 10.5, "And the priests that bare the ark of the covenant of the LORD stood firm on dry ground in the midst of Jordan", "Joshua 3:17"),
    ],
  },
  {
    id: "jericho", module: "jericho", length: 22, enter: t("light", 1.6), years: [[0, -1408], [22, -1408]],
    chronicle: { chapters: ["joshua:2-6"], span: 200 },
    captions: [
      n(1.5, 5, "Six days they compassed the city once. On the seventh day, seven times.", "Joshua 6"),
      v(16, 20.5, "the people shouted with a great shout, that the wall fell down flat", "Joshua 6:20"),
    ],
  },
  {
    id: "allotment", module: "maps", program: "allotment", length: 12, enter: t("dust", 2), years: [[0, -1400], [12, -1385]],
    chronicle: { chapters: ["joshua:13-24"], span: 200 },
    captions: [
      v(6, 11, "but as for me and my house, we will serve the LORD.", "Joshua 24:15"),
    ],
  },
  // ---------------------------------------------------------------- Act XIII
  {
    id: "judges", module: "judges", length: 26, enter: t("dark", 2), years: [[0, -1380], [6, -1290], [12, -1200], [17, -1110], [22, -1060], [26, -1045]],
    chronicle: { chapters: ["judges:1-21"], span: 250 },
    acts: [{ label: "Act XIII", title: "The Judges", at: 0 }],
    captions: [
      v(1.5, 5, "Nevertheless the LORD raised up judges, which delivered them out of the hand of those that spoiled them.", "Judges 2:16"),
      v(5.5, 9, "And Deborah, a prophetess, the wife of Lapidoth, she judged Israel at that time.", "Judges 4:4", "Deborah"),
      v(9.5, 14, "and brake the pitchers, and held the lamps in their left hands … The sword of the LORD, and of Gideon.", "Judges 7:20", "Gideon"),
      v(15, 20, "And he bowed himself with all his might; and the house fell upon the lords, and upon all the people that were therein.", "Judges 16:30", "Samson"),
      v(20.5, 24.5, "In those days there was no king in Israel: every man did that which was right in his own eyes.", "Judges 21:25"),
    ],
  },
  // ---------------------------------------------------------------- Act XIV
  {
    id: "ruth", module: "ruth", length: 16, enter: t("gold", 2), years: [[0, -1120], [10, -1105], [16, -1100]],
    meanwhile: "In the days when the judges ruled (Ruth 1:1)",
    chronicle: { chapters: ["ruth:1-4"], span: 150 },
    acts: [{ label: "Act XIV", title: "Ruth & the Line of David", at: 0 }],
    captions: [
      v(1.5, 7, "whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people, and thy God my God", "Ruth 1:16"),
      v(8, 13.5, "and they called his name Obed: he is the father of Jesse, the father of David.", "Ruth 4:17"),
    ],
  },
  // ---------------------------------------------------------------- Act XV
  {
    id: "shiloh", module: "shiloh", length: 10, enter: t("night", 2), years: [[0, -1090], [10, -1080]],
    chronicle: { chapters: ["1-samuel:1-8"], span: 150 },
    acts: [{ label: "Act XV", title: "Samuel, Saul & the Kingdom", at: 0 }],
    captions: [
      v(1.5, 5, "And ere the lamp of God went out in the temple of the LORD", "1 Samuel 3:3"),
      v(5.5, 8.8, "Speak; for thy servant heareth.", "1 Samuel 3:10"),
    ],
  },
  {
    id: "elah", module: "elah", length: 20, enter: t("dust", 2), years: [[0, -1024], [20, -1024]],
    chronicle: { chapters: ["1-samuel:16-17"], span: 150 },
    captions: [
      v(1.5, 5.5, "for man looketh on the outward appearance, but the LORD looketh on the heart.", "1 Samuel 16:7"),
      v(6.5, 11, "Thou comest to me with a sword, and with a spear, and with a shield: but I come to thee in the name of the LORD of hosts", "1 Samuel 17:45"),
      v(12.5, 17, "and smote the Philistine in his forehead … and he fell upon his face to the earth.", "1 Samuel 17:49"),
    ],
  },
  // ---------------------------------------------------------------- Act XVI
  {
    id: "david", module: "david", length: 24, enter: t("light", 2), years: [[0, -1003], [8, -995], [14, -990], [19, -975], [24, -971]],
    chronicle: { chapters: ["2-samuel:5-24"], span: 120 },
    acts: [{ label: "Act XVI", title: "King David", at: 0 }],
    captions: [
      v(1.5, 5, "And David danced before the LORD with all his might", "2 Samuel 6:14"),
      v(6, 10.5, "When I consider thy heavens, the work of thy fingers, the moon and the stars, which thou hast ordained", "Psalm 8:3"),
      v(11, 14.5, "The LORD is my shepherd; I shall not want.", "Psalm 23:1"),
      v(15, 19, "O my son Absalom, my son, my son Absalom! would God I had died for thee", "2 Samuel 18:33"),
      v(19.5, 22.8, "thy throne shall be established for ever.", "2 Samuel 7:16"),
    ],
  },
  // ---------------------------------------------------------------- Act XVII
  {
    id: "temple", module: "temple", length: 36, enter: t("gold", 2), years: [[0, -966], [16, -959], [26, -950], [36, -931]],
    chronicle: { chapters: ["1-kings:1-11"], span: 120 },
    acts: [{ label: "Act XVII", title: "Solomon & the First Temple", at: 0 }],
    captions: [
      v(2, 7, "in the fourth year of Solomon’s reign over Israel … he began to build the house of the LORD.", "1 Kings 6:1"),
      v(18, 22, "the cloud filled the house of the LORD", "1 Kings 8:10"),
      v(22.5, 27, "behold, the heaven and heaven of heavens cannot contain thee; how much less this house that I have builded?", "1 Kings 8:27"),
      v(27.5, 31.5, "And when the queen of Sheba heard of the fame of Solomon … she came to prove him with hard questions.", "1 Kings 10:1"),
    ],
  },
  // ---------------------------------------------------------------- Act XVIII
  {
    id: "divided", module: "maps", program: "divided", length: 22, enter: t("dark", 2), years: [[0, -931], [22, -860]],
    chronicle: { chapters: ["1-kings:12-22", "2-kings:1-17"], span: 220, kings: true },
    acts: [{ label: "Act XVIII", title: "The Divided Kingdom", at: 0 }],
    captions: [
      v(2, 7, "What portion have we in David? … to your tents, O Israel: now see to thine own house, David.", "1 Kings 12:16"),
      n(8, 15, "Israel in the north, Judah in the south. Their kings and prophets run along the timeline below, dated by the Toledot chronology.", "Two kingdoms"),
    ],
  },
  {
    id: "carmel", module: "carmel", length: 18, enter: t("dust", 2), years: [[0, -860], [18, -860]],
    chronicle: { chapters: ["1-kings:17-19"], span: 120 },
    acts: [{ label: "Act XIX", title: "The Prophets", at: 0 }],
    captions: [
      v(1.5, 5.5, "How long halt ye between two opinions? if the LORD be God, follow him: but if Baal, then follow him.", "1 Kings 18:21", "Elijah on Carmel"),
      v(9, 13, "Then the fire of the LORD fell, and consumed the burnt sacrifice, and the wood, and the stones", "1 Kings 18:38"),
      h(13.5, 16.8, "The LORD, he is the God", "1 Kings 18:39"),
    ],
  },
  {
    id: "isaiah", module: "isaiah", length: 16, enter: t("light", 2), years: [[0, -740], [16, -740]],
    chronicle: { chapters: ["isaiah:1-6", "2-kings:15-16"], span: 150 },
    captions: [
      v(1.5, 5.5, "I saw also the Lord sitting upon a throne, high and lifted up, and his train filled the temple.", "Isaiah 6:1", "Isaiah"),
      h(6, 10.5, "Holy, holy, holy, is the LORD of hosts", "Isaiah 6:3", "the whole earth is full of his glory."),
      v(11, 14.8, "Whom shall I send, and who will go for us? Then said I, Here am I; send me.", "Isaiah 6:8"),
    ],
  },
  // ---------------------------------------------------------------- Act XX
  {
    id: "assyria", module: "maps", program: "assyria", length: 14, enter: t("dark", 2), years: [[0, -738], [9, -722], [14, -720]],
    chronicle: { chapters: ["2-kings:15-18"], span: 150, kings: true },
    acts: [{ label: "Act XX", title: "Assyria & the Fall of Israel", at: 0 }],
    captions: [
      v(7, 12.5, "the king of Assyria took Samaria, and carried Israel away into Assyria, and placed them in Halah and in Habor by the river of Gozan, and in the cities of the Medes.", "2 Kings 17:6"),
    ],
  },
  // ---------------------------------------------------------------- Act XXI
  {
    id: "fall", module: "fall", length: 22, enter: t("ash", 2), years: [[0, -586], [22, -585]],
    chronicle: { chapters: ["2-kings:24-25", "jeremiah:39-52"], span: 120 },
    acts: [{ label: "Act XXI", title: "Babylon & the Fall of Jerusalem", at: 0 }],
    captions: [
      v(2, 7, "And he burnt the house of the LORD, and the king’s house, and all the houses of Jerusalem", "2 Kings 25:9"),
      v(9, 14, "How doth the city sit solitary, that was full of people! how is she become as a widow!", "Lamentations 1:1"),
      n(15, 20, "The captives are led east, along the rivers, to Babylon.", "The exile"),
    ],
  },
  {
    id: "exile", module: "maps", program: "exile", length: 10, enter: t("ash", 2), years: [[0, -585], [10, -584]],
    chronicle: { chapters: ["2-kings:25"], span: 120 },
    captions: [],
  },
  {
    id: "babylon", module: "babylon", length: 22, enter: t("dust", 2), years: [[0, -584], [11, -580], [22, -575]],
    chronicle: { chapters: ["psalms:137", "daniel:1-3"], span: 120 },
    acts: [{ label: "Act XXII", title: "Exile in Babylon", at: 0 }],
    captions: [
      v(2, 6.5, "By the rivers of Babylon, there we sat down, yea, we wept, when we remembered Zion.", "Psalm 137:1"),
      v(11, 16, "Lo, I see four men loose, walking in the midst of the fire, and they have no hurt", "Daniel 3:25"),
    ],
  },
  {
    id: "chebar", module: "chebar", length: 22, enter: t("dust", 2), years: [[0, -592], [22, -592]],
    meanwhile: "The fifth year of Jehoiachin's captivity (Ezekiel 1:2)",
    chronicle: { chapters: ["ezekiel:1-3", "ezekiel:10"], span: 120 },
    captions: [
      v(1.5, 5.5, "as I was among the captives by the river of Chebar, that the heavens were opened, and I saw visions of God.", "Ezekiel 1:1", "Ezekiel"),
      v(6, 9.5, "behold, a whirlwind came out of the north, a great cloud, and a fire infolding itself", "Ezekiel 1:4"),
      v(10, 13.5, "And every one had four faces, and every one had four wings.", "Ezekiel 1:6"),
      v(14, 17.5, "their appearance and their work was as it were a wheel in the middle of a wheel.", "Ezekiel 1:16"),
      v(18, 21.5, "This is the living creature that I saw under the God of Israel by the river of Chebar; and I knew that they were the cherubims.", "Ezekiel 10:20"),
    ],
  },
  {
    id: "bones", module: "bones", length: 24, enter: t("dust", 2), years: [[0, -574], [24, -574]],
    chronicle: { chapters: ["ezekiel:33-48"], span: 120 },
    captions: [
      v(1.5, 5, "and set me down in the midst of the valley which was full of bones", "Ezekiel 37:1", "The valley of dry bones"),
      h(5.5, 8.5, "Son of man, can these bones live?", "Ezekiel 37:3"),
      v(9, 12.5, "there was a noise, and behold a shaking, and the bones came together, bone to his bone.", "Ezekiel 37:7"),
      v(13, 16, "lo, the sinews and the flesh came up upon them, and the skin covered them above: but there was no breath in them.", "Ezekiel 37:8"),
      v(16.5, 19.5, "Come from the four winds, O breath, and breathe upon these slain, that they may live.", "Ezekiel 37:9"),
      v(20, 23.5, "and the breath came into them, and they lived, and stood up upon their feet, an exceeding great army.", "Ezekiel 37:10"),
    ],
  },
  {
    id: "daniel", module: "daniel", length: 22, enter: t("night", 2), years: [[0, -553], [12, -539], [22, -539]],
    chronicle: { chapters: ["daniel:4-12"], span: 120 },
    captions: [
      v(1.5, 6, "the Ancient of days did sit, whose garment was white as snow … his throne was like the fiery flame", "Daniel 7:9", "Daniel’s vision"),
      v(6.5, 10.5, "one like the Son of man came with the clouds of heaven, and came to the Ancient of days", "Daniel 7:13"),
      h(11.5, 15, "MENE, MENE, TEKEL, UPHARSIN", "Daniel 5:25"),
      v(15.5, 20.5, "My God hath sent his angel, and hath shut the lions’ mouths, that they have not hurt me", "Daniel 6:22"),
    ],
  },
  // ---------------------------------------------------------------- Act XXIII
  {
    id: "return", module: "return", length: 24, enter: t("light", 2), years: [[0, -537], [8, -536], [14, -478], [20, -444], [24, -444]],
    chronicle: { chapters: ["ezra:1-10", "nehemiah:1-13", "esther:1-10"], span: 120 },
    acts: [{ label: "Act XXIII", title: "The Return", at: 0 }],
    captions: [
      v(1.5, 6, "the LORD stirred up the spirit of Cyrus king of Persia, that he made a proclamation throughout all his kingdom", "Ezra 1:1"),
      v(6.5, 11, "And all the people shouted with a great shout … because the foundation of the house of the LORD was laid.", "Ezra 3:11"),
      v(12, 16.5, "and who knoweth whether thou art come to the kingdom for such a time as this?", "Esther 4:14", "Esther in Susa"),
      v(17.5, 21.5, "So the wall was finished in the twenty and fifth day of the month Elul, in fifty and two days.", "Nehemiah 6:15"),
    ],
  },
  {
    id: "silence", module: "maps", program: "silence", length: 22, enter: t("dark", 2), years: [[0, -430], [5, -331], [10, -200], [14, -164], [18, -63], [22, -6]],
    chronicle: { chapters: ["malachi:1-4", "1-maccabees:1-16"], span: 300 },
    acts: [{ label: "Interlude", title: "Four Hundred Years", at: 0 }],
    captions: [
      v(1.5, 5.5, "Behold, I will send my messenger, and he shall prepare the way before me", "Malachi 3:1"),
      v(12, 16, "and the lamps that were upon the candlestick they lighted, that they might give light in the temple.", "1 Maccabees 4:50"),
      v(17.5, 21, "But unto you that fear my name shall the Sun of righteousness arise with healing in his wings", "Malachi 4:2"),
    ],
  },
  // ---------------------------------------------------------------- Act XXIV
  {
    id: "nativity", module: "nativity", length: 20, enter: t("night", 2), years: [[0, -5], [20, -4]],
    chronicle: { chapters: ["luke:1-2", "matthew:1-2"], span: 60 },
    acts: [{ label: "Act XXIV", title: "The Word Made Flesh", at: 0 }],
    captions: [
      v(1.5, 5, "Fear not, Mary: for thou hast found favour with God.", "Luke 1:30"),
      v(6, 9.5, "And there were in the same country shepherds abiding in the field, keeping watch over their flock by night.", "Luke 2:8"),
      v(10, 13.5, "For unto you is born this day in the city of David a Saviour, which is Christ the Lord.", "Luke 2:11"),
      h(14, 18.5, "Glory to God in the highest", "Luke 2:14", "and on earth peace, good will toward men."),
    ],
  },
  {
    id: "baptism", module: "baptism", length: 12, enter: t("light", 2), years: [[0, 28], [12, 28]],
    chronicle: { chapters: ["matthew:3", "mark:1", "luke:3", "john:1"], span: 60 },
    captions: [
      v(1.5, 6, "and, lo, the heavens were opened unto him, and he saw the Spirit of God descending like a dove", "Matthew 3:16"),
      v(6.5, 10.5, "This is my beloved Son, in whom I am well pleased.", "Matthew 3:17"),
    ],
  },
  {
    id: "temptation", module: "temptation", length: 34, enter: t("dust", 2), years: [[0, 28], [34, 28]],
    chronicle: { chapters: ["matthew:4", "mark:1", "luke:4"], span: 60 },
    captions: [
      v(1.5, 5, "Then was Jesus led up of the Spirit into the wilderness to be tempted of the devil.", "Matthew 4:1", "The temptation"),
      v(5.5, 8.5, "And when he had fasted forty days and forty nights, he was afterward an hungred.", "Matthew 4:2"),
      v(9, 12, "If thou be the Son of God, command that these stones be made bread.", "Matthew 4:3", "The tempter"),
      v(12.5, 15.5, "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.", "Matthew 4:4"),
      v(16, 19, "Then the devil taketh him up into the holy city, and setteth him on a pinnacle of the temple", "Matthew 4:5"),
      v(19.5, 22, "Thou shalt not tempt the Lord thy God.", "Matthew 4:7"),
      v(22.6, 25.8, "the devil taketh him up into an exceeding high mountain, and sheweth him all the kingdoms of the world, and the glory of them", "Matthew 4:8"),
      v(26.2, 29, "Get thee hence, Satan: for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve.", "Matthew 4:10"),
      v(29.5, 33, "Then the devil leaveth him, and, behold, angels came and ministered unto him.", "Matthew 4:11"),
    ],
  },
  {
    id: "galilee", module: "galilee", length: 30, enter: t("light", 2), years: [[0, 28], [30, 29]],
    chronicle: { chapters: ["matthew:4-17", "mark:1-9", "luke:4-9"], span: 60, gospels: true },
    captions: [
      v(1.5, 4.5, "Follow me, and I will make you fishers of men.", "Matthew 4:19"),
      v(5, 8.5, "Ye are the light of the world. A city that is set on an hill cannot be hid.", "Matthew 5:14"),
      v(9.5, 13.5, "Peace, be still. And the wind ceased, and there was a great calm.", "Mark 4:39"),
      v(15, 19, "and they took up of the fragments that remained twelve baskets full.", "Matthew 14:20"),
      v(21, 26, "and his face did shine as the sun, and his raiment was white as the light.", "Matthew 17:2"),
    ],
  },
  {
    id: "passion", module: "passion", length: 40, enter: t("dust", 2), years: [[0, 30], [34, 30]],
    chronicle: { chapters: ["matthew:21-27", "mark:11-15", "luke:19-23", "john:12-19"], span: 60, gospels: true },
    captions: [
      v(1.5, 5, "Hosanna to the Son of David: Blessed is he that cometh in the name of the Lord", "Matthew 21:9"),
      v(6, 9.5, "Jesus took bread, and blessed it, and brake it, and gave it to the disciples, and said, Take, eat; this is my body.", "Matthew 26:26"),
      v(10, 14, "O my Father, if it be possible, let this cup pass from me: nevertheless not as I will, but as thou wilt.", "Matthew 26:39"),
      v(15, 18.5, "Father, forgive them; for they know not what they do.", "Luke 23:34"),
      v(19, 22.5, "Now from the sixth hour there was darkness over all the land unto the ninth hour.", "Matthew 27:45"),
      h(23, 26, "It is finished", "John 19:30"),
      v(26.5, 31, "And, behold, the veil of the temple was rent in twain from the top to the bottom", "Matthew 27:51"),
      v(32.5, 38.5, "And the graves were opened; and many bodies of the saints which slept arose,", "Matthew 27:52"),
    ],
  },
  {
    id: "risen", module: "risen", length: 24, enter: t("dark", 2.4), years: [[0, 30], [14, 30]],
    chronicle: { chapters: ["matthew:28", "mark:16", "luke:24", "john:20-21"], span: 60, gospels: true },
    captions: [
      h(3, 7.5, "He is not here: for he is risen", "Matthew 28:6", "as he said."),
      v(8, 12.5, "I am the resurrection, and the life", "John 11:25"),
      v(14, 22.5, "And came out of the graves after his resurrection, and went into the holy city, and appeared unto many.", "Matthew 27:53"),
    ],
  },
  // ---------------------------------------------------------------- Act XXV
  {
    id: "pentecost", module: "pentecost", length: 16, enter: t("light", 2), years: [[0, 30], [16, 30]],
    chronicle: { chapters: ["acts:1-4"], span: 60 },
    acts: [{ label: "Act XXV", title: "The Church", at: 0 }],
    captions: [
      v(1.5, 5, "he was taken up; and a cloud received him out of their sight.", "Acts 1:9"),
      v(6, 10, "And suddenly there came a sound from heaven as of a rushing mighty wind", "Acts 2:2"),
      v(10.5, 14.5, "And there appeared unto them cloven tongues like as of fire, and it sat upon each of them.", "Acts 2:3"),
    ],
  },
  {
    id: "paul", module: "maps", program: "paul", length: 26, enter: t("dark", 2), years: [[0, 34], [5, 46], [11, 50], [17, 53], [23, 60], [26, 62]],
    chronicle: { chapters: ["acts:9-28"], span: 60 },
    captions: [
      v(1, 4.5, "and suddenly there shined round about him a light from heaven", "Acts 9:3"),
      v(10.5, 14, "Come over into Macedonia, and help us.", "Acts 16:9"),
      v(21.5, 25, "Preaching the kingdom of God … with all confidence, no man forbidding him.", "Acts 28:31"),
    ],
  },
  // ---------------------------------------------------------------- Act XXVI
  {
    id: "patmos", module: "patmos", length: 14, enter: t("night", 2), years: [[0, 95], [14, 95]],
    chronicle: { chapters: ["revelation:1-3"], span: 80 },
    acts: [{ label: "Act XXVI", title: "Revelation", at: 0 }],
    captions: [
      v(1.5, 5.5, "I John … was in the isle that is called Patmos, for the word of God, and for the testimony of Jesus Christ.", "Revelation 1:9"),
      v(6, 9.5, "And I turned to see the voice that spake with me. And being turned, I saw seven golden candlesticks", "Revelation 1:12"),
      v(10, 12.8, "Fear not; I am the first and the last", "Revelation 1:17"),
    ],
  },
  {
    id: "throne", module: "throne", length: 26, enter: t("light", 2), years: null,
    captions: [
      v(1.5, 5, "behold, a door was opened in heaven", "Revelation 4:1"),
      v(5.5, 9.5, "and there was a rainbow round about the throne, in sight like unto an emerald.", "Revelation 4:3"),
      v(10, 13.5, "Holy, holy, holy, Lord God Almighty, which was, and is, and is to come.", "Revelation 4:8"),
      h(14, 17.5, "Worthy is the Lamb that was slain", "Revelation 5:12"),
      v(18, 21.5, "and the sun became black as sackcloth of hair, and the moon became as blood", "Revelation 6:12"),
      v(22, 24.8, "there was silence in heaven about the space of half an hour.", "Revelation 8:1"),
    ],
  },
  {
    id: "newcreation", module: "newcreation", length: 34, enter: t("dark", 2.4), years: null,
    captions: [
      v(1.5, 5, "Babylon the great is fallen, is fallen", "Revelation 18:2"),
      v(5.5, 9.5, "And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away", "Revelation 21:1"),
      v(10, 14, "And I John saw the holy city, new Jerusalem, coming down from God out of heaven", "Revelation 21:2"),
      v(14.5, 18.5, "And God shall wipe away all tears from their eyes; and there shall be no more death", "Revelation 21:4"),
      v(19, 23, "and on either side of the river, was there the tree of life … and the leaves of the tree were for the healing of the nations.", "Revelation 22:2"),
      h(23.5, 27, "Behold, I make all things new", "Revelation 21:5"),
      v(27.5, 30.5, "I am Alpha and Omega, the beginning and the end, the first and the last.", "Revelation 22:13"),
      h(30.8, 33.6, "Even so, come, Lord Jesus", "Revelation 22:20"),
    ],
  },
];

// ---------------------------------------------------------------- derived layout
let offset = 0;
for (const s of SCENES) {
  s.from = offset;
  s.to = offset + s.length;
  offset = s.to;
}
export const LENGTH = offset;

export const ACTS = SCENES.flatMap((s) => (s.acts ?? []).map((a) => ({ ...a, scene: s.id, at: s.from + a.at, built: true })));

export const CAPTIONS = SCENES.flatMap((s) => (s.captions ?? []).map((c) => ({ ...c, scene: s.id, from: s.from + c.from, to: s.from + c.to })));

export const TRANSITIONS = SCENES.filter((s) => s.enter).map((s) => ({ at: s.from, ...s.enter }));

/** Smooth 0..1 envelope: rises over `fade` units after `from`, falls over `fade` units before `to`. */
export function envelope(u, from, to, fade = 1.2) {
  if (u <= from || u >= to) return 0;
  const a = Math.min(1, (u - from) / fade);
  const b = Math.min(1, (to - u) / fade);
  const x = Math.min(a, b);
  return x * x * (3 - 2 * x);
}

/** Active scene index, its local units, and the transition overlay at story unit `u`. */
export function locate(u) {
  let i = SCENES.findIndex((s) => u >= s.from && u < s.to);
  if (i < 0) i = u < 0 ? 0 : SCENES.length - 1;
  const scene = SCENES[i];
  const rel = Math.min(scene.length, Math.max(0, u - scene.from));
  let fade = 0;
  let transition = null;
  for (const tr of TRANSITIONS) {
    const d = Math.abs(u - tr.at);
    if (d < tr.width) {
      const x = 1 - d / tr.width;
      const val = x * x * (3 - 2 * x);
      if (val > fade) { fade = val; transition = tr; }
    }
  }
  return { index: i, scene, rel, local: rel / scene.length, fade, transition };
}

/** Story year (astronomical) at unit u, or null before time began / beyond it. */
export function yearAt(u) {
  const { scene, rel } = locate(u);
  if (!scene.years) return null;
  const ys = scene.years;
  if (rel <= ys[0][0]) return ys[0][1];
  for (let i = 0; i < ys.length - 1; i++) {
    const [a, ya] = ys[i];
    const [b, yb] = ys[i + 1];
    if (rel <= b) return ya + ((yb - ya) * (rel - a)) / (b - a);
  }
  return ys[ys.length - 1][1];
}
