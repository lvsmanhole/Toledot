// Map interludes: each story beat that is about movement across the land is told on the ancient map.
// Routes follow traditional reconstructions where the text does not fix the way; such maps say so.

import { createMapScene } from "../kit/map.js";

const GOLD = [1, 0.72, 0.32];
const EMBER = [1, 0.42, 0.2];
const PALE = [0.75, 0.82, 0.95];
const GREEN = [0.55, 0.85, 0.55];

const PROGRAMS = {
  // Genesis 10–11: the families of Noah's sons spread from Babel
  nations: {
    camera: [[0, [44.4, 30.8, 55], [44.4, 32.6]], [5, [42, 25.5, 170], [40, 33]], [14, [36, 19, 270], [36, 33.5]]],
    places: [{ place: "babel", from: 0, to: 14, label: "Babel", big: true }],
    routes: [
      { points: ["babel", [41, 36.5], [36, 38.5], [31, 39], [26.5, 39.5], [23, 40.2]], from: 2, to: 8, color: PALE },
      { points: ["babel", "mari", [38.5, 35], "damascus", "jerusalem", [32, 30.8], "memphis", [32.6, 25.7], [33.5, 22]], from: 2.5, to: 9, color: EMBER },
      { points: ["babel", [46.5, 30.5], [49, 28], [46.5, 24], [43, 22]], from: 3, to: 9.5, color: GOLD },
      { points: ["babel", "nineveh", [46, 37.5]], from: 3.5, to: 8, color: GOLD },
      { points: ["babel", "susa", [51, 31.5]], from: 4, to: 9, color: GOLD },
    ],
    labels: [
      { text: "The sons of Japheth", at: [30, 40.6], from: 6, to: 14 },
      { text: "The sons of Ham", at: [31.5, 26], from: 6.5, to: 14 },
      { text: "The sons of Shem", at: [46.5, 27.5], from: 7, to: 14 },
    ],
  },

  // Genesis 11:31–13: Ur → Haran → Shechem → Bethel → Egypt → Bethel → Hebron; Melchizedek at Salem
  abraham: {
    camera: [[0, [46.6, 28.6, 42], [46.1, 31.2]], [4, [43.5, 30.5, 110], [42, 34]], [8, [37, 29, 90], [37, 33.2]], [12, [33.4, 27.4, 80], [33, 30.6]], [16, [35.6, 29.6, 46], [35.2, 31.7]], [22, [35.4, 30.4, 26], [35.2, 31.8]]],
    places: [
      { place: "ur", from: 0, to: 6, label: "Ur of the Chaldees", big: true },
      { place: "haran", from: 3, to: 9, label: "Haran" },
      { place: "shechem", from: 6.5, to: 12, label: "Shechem" },
      { place: "bethel", from: 7.5, to: 22, label: "Bethel" },
      { place: "memphis", from: 10.5, to: 15, label: "Egypt" },
      { place: "hebron", from: 14, to: 22, label: "Hebron · Mamre" },
      { place: "jerusalem", from: 15, to: 22, label: "Salem", big: true },
    ],
    routes: [
      { points: ["ur", [45.2, 31.6], "babylon", [43.5, 33.6], "mari", [39.6, 35.6], "haran"], from: 0.8, to: 5, color: GOLD },
      { points: ["haran", "carchemish", [37.4, 35.6], "damascus", [35.6, 32.7], "shechem", "bethel"], from: 5.5, to: 9.5, color: GOLD },
      { points: ["bethel", "hebron", "beersheba", [33.8, 30.9], "goshen", "memphis"], from: 10, to: 13, color: GOLD },
      { points: ["memphis", [33.2, 30.9], "beersheba", "bethel", "hebron"], from: 13.2, to: 15.5, color: GOLD },
    ],
    showRegions: true,
  },

  // Exodus 12 – Deuteronomy 34: one traditional reconstruction of the route
  wilderness: {
    camera: [[0, [32.6, 27.6, 60], [32.6, 30.2]], [4, [33.6, 26.2, 70], [33.8, 28.8]], [8, [35, 27.3, 75], [34.8, 30.4]], [11, [35.6, 29.6, 28], [35.5, 31.6]], [14, [35.62, 30.6, 16], [35.3, 31.9]]],
    places: [
      { place: "rameses", from: 0, to: 6, label: "Rameses" },
      { place: "sinai", from: 2.5, to: 9, label: "Mount Sinai (traditional)", big: true },
      { place: "kadesh", from: 4.5, to: 10, label: "Kadesh-barnea" },
      { place: "nebo", from: 7.5, to: 14, label: "Mount Nebo", big: true },
      { place: "jericho", from: 10, to: 14, label: "Jericho" },
    ],
    routes: [
      { points: ["rameses", "succoth", [32.45, 30.25], [32.6, 29.95], [32.97, 29.43], [33.05, 29.25], [33.6, 28.75], "sinai"], from: 0.5, to: 3.5, color: GOLD },
      { points: ["sinai", [34.3, 29.2], [34.6, 29.9], "kadesh"], from: 3.6, to: 5, color: GOLD },
      { points: ["kadesh", [34.6, 30.2], [34.95, 29.6], [35.3, 30.1], [34.9, 30.4], "kadesh", [35.2, 30.5], [34.98, 29.55], [35.6, 30.0], [35.85, 30.8], [35.8, 31.4], "nebo"], from: 5, to: 9, color: EMBER },
    ],
    labels: [
      { text: "One traditional reconstruction of the route", at: [31.0, 28.0], from: 0.5, to: 9, size: 0.85 },
      { text: "Forty years", at: [35.6, 29.3], from: 5.5, to: 9.5 },
      { text: "The land of promise", at: [35.0, 32.3], from: 10, to: 14, size: 1.2 },
    ],
  },

  // Joshua 13–19: approximate tribal portions (centres only, not boundaries)
  allotment: {
    camera: [[0, [35.3, 30.2, 34], [35.3, 32]], [12, [35.25, 30.8, 24], [35.3, 32.1]]],
    regions: [
      ["Asher", [35.22, 33.0], 0.22, [0.85, 0.7, 0.4]], ["Naphtali", [35.55, 33.05], 0.2, [0.6, 0.75, 0.9]], ["Zebulun", [35.3, 32.75], 0.13, [0.7, 0.9, 0.7]],
      ["Issachar", [35.45, 32.58], 0.15, [0.9, 0.6, 0.5]], ["Manasseh", [35.15, 32.38], 0.22, [0.75, 0.6, 0.9]], ["Ephraim", [35.22, 32.08], 0.16, [0.95, 0.8, 0.5]],
      ["Dan", [34.88, 31.88], 0.13, [0.6, 0.85, 0.85]], ["Benjamin", [35.3, 31.84], 0.1, [0.9, 0.75, 0.75]], ["Judah", [35.05, 31.42], 0.32, [1, 0.72, 0.32]],
      ["Simeon", [34.8, 31.12], 0.18, [0.75, 0.75, 0.6]], ["Reuben", [35.78, 31.62], 0.2, [0.85, 0.6, 0.6]], ["Gad", [35.75, 32.12], 0.2, [0.6, 0.8, 0.6]],
      ["Manasseh (east)", [36.0, 32.75], 0.3, [0.75, 0.6, 0.9]],
    ].map(([label, center, radius, color], i) => ({ label, center, radius, color, from: 0.5 + i * 0.25, to: 12 })),
    labels: [{ text: "Approximate tribal portions (Joshua 13–19)", at: [34.2, 30.6], from: 1, to: 12, size: 0.85 }],
  },

  // 1 Kings 12 – 2 Kings 17: two kingdoms
  divided: {
    camera: [[0, [35.2, 29.8, 40], [35.25, 31.9]], [22, [35.2, 30.2, 30], [35.25, 32.2]]],
    regions: [
      { label: "Israel", center: [35.35, 32.55], radius: 0.75, color: PALE, from: 1, to: 22 },
      { label: "Judah", center: [35.05, 31.45], radius: 0.55, color: GOLD, from: 1.5, to: 22 },
    ],
    places: [
      { place: "samaria", from: 3, to: 22, label: "Samaria" },
      { place: "jerusalem", from: 2, to: 22, label: "Jerusalem", big: true },
      { place: "dan", from: 5, to: 15, label: "Dan · golden calf" },
      { place: "bethel", from: 5.5, to: 15, label: "Bethel · golden calf" },
    ],
    labels: [{ text: "The kingdom divides · 930 BC", at: [34.3, 31.0], from: 1, to: 9, size: 1 }],
  },

  // 2 Kings 15–17: Assyria comes west; Samaria falls; Israel is carried away
  assyria: {
    camera: [[0, [41.5, 30.5, 140], [40, 34.5]], [8, [37.5, 30.2, 90], [37.2, 33.8]], [14, [41, 31.2, 140], [40.5, 35]]],
    regions: [
      { label: "Assyria", center: "nineveh", radius: 3, color: EMBER, from: 0.5, to: 14 },
      { center: [40.5, 35.5], radius: 6, color: EMBER, from: 3, to: 14 },
      { center: [38, 34.5], radius: 7.5, color: EMBER, from: 5.5, to: 14 },
    ],
    places: [
      { place: "nineveh", from: 0, to: 14, label: "Nineveh", big: true },
      { place: "samaria", from: 4, to: 14, label: "Samaria · 722 BC" },
      { place: "halah", from: 9, to: 14, label: "Halah" },
      { place: "gozan", from: 9.5, to: 14, label: "Habor, river of Gozan" },
      { place: "ecbatana", from: 10, to: 14, label: "Cities of the Medes" },
    ],
    routes: [
      { points: ["nineveh", [40.5, 36.6], "carchemish", "hamath", "damascus", "samaria"], from: 2, to: 6.5, color: EMBER },
      { points: ["samaria", "damascus", "hamath", "carchemish", "gozan"], from: 8, to: 11, color: PALE },
      { points: ["gozan", "nineveh", "halah"], from: 9.5, to: 12, color: PALE },
      { points: ["halah", [46.5, 35.5], "ecbatana"], from: 10.5, to: 13, color: PALE },
    ],
  },

  // 2 Kings 25: the road to Babylon
  exile: {
    camera: [[0, [35.6, 29.5, 45], [35.3, 31.9]], [5, [39.5, 29.5, 120], [39.5, 33.8]], [10, [44.6, 30.2, 60], [44.4, 32.6]]],
    places: [
      { place: "jerusalem", from: 0, to: 6, label: "Jerusalem · 586 BC", big: true },
      { place: "riblah", from: 2, to: 8, label: "Riblah" },
      { place: "babylon", from: 5, to: 10, label: "Babylon", big: true },
    ],
    routes: [{ points: ["jerusalem", [35.6, 32.6], "damascus", "riblah", "hamath", [37.6, 35.9], [39.6, 35.4], "mari", [42.4, 34.0], [43.8, 33.35], "babylon"], from: 0.5, to: 8, color: PALE }],
    labels: [{ text: "About 900 miles, along the rivers", at: [40.5, 33.0], from: 3, to: 9, size: 0.9 }],
  },

  // Between the testaments: Persia, Alexander, the Greek kingdoms, the Maccabees, Rome
  silence: {
    camera: [[0, [40, 22, 230], [38, 33]], [10, [34, 22, 230], [34, 33.5]], [14, [35.6, 29.6, 45], [35.25, 31.8]], [17, [30, 24, 260], [26, 36]], [22, [35.6, 29.8, 40], [35.25, 31.8]]],
    regions: [
      { label: "Persia", center: [47, 31], radius: 9, color: GOLD, from: 0.3, to: 5.2 },
      { label: "Alexander", center: [36, 33], radius: 11, color: PALE, from: 5, to: 10.2 },
      { label: "The Ptolemies", center: [31, 28.5], radius: 4, color: EMBER, from: 9.8, to: 14 },
      { label: "The Seleucids", center: [41, 35], radius: 6, color: GREEN, from: 9.8, to: 14 },
      { label: "Rome", center: [24, 38], radius: 14, color: [0.9, 0.45, 0.45], from: 16, to: 22 },
    ],
    routes: [{ points: [[22.5, 40.6], [26.4, 40.1], [36.2, 36.85], "tyre", "gaza", "alexandria", "memphis", [38, 36.3], "babylon", "susa", "persepolis"], from: 5.5, to: 9.5, color: PALE, fadeOut: [10, 11.5] }],
    places: [
      { place: "jerusalem", from: 12, to: 22, label: "Jerusalem", big: true },
      { place: "rome", from: 16, to: 22, label: "Rome", big: true },
    ],
    labels: [
      { text: "Persian rule · from 539 BC", at: [47, 27.5], from: 0.6, to: 5 },
      { text: "Alexander · 333–323 BC", at: [36, 27], from: 5.5, to: 10 },
      { text: "The temple rededicated · 164 BC", at: [35.3, 31.35], from: 12.2, to: 16 },
      { text: "Pompey takes Jerusalem · 63 BC", at: [24, 33], from: 17, to: 22 },
    ],
  },

  // Acts 9–28: Paul's journeys and the voyage to Rome
  paul: {
    camera: [[0, [36.4, 31.4, 40], [36.3, 33.5]], [4, [33.5, 32.4, 90], [33.5, 36.6]], [10, [27.5, 33.0, 110], [26.5, 38.2]], [16, [26.5, 33.0, 120], [27, 38.2]], [22, [21, 30.0, 190], [21, 37.2]], [26, [12.8, 39.6, 30], [12.5, 41.9]]],
    places: [
      { place: "damascus", from: 0, to: 4.5, label: "Damascus", big: true },
      { place: "antioch", from: 4, to: 20, label: "Antioch" },
      { place: "ephesus", from: 9.5, to: 21, label: "Ephesus" },
      { place: "corinth", from: 11, to: 21, label: "Corinth" },
      { place: "athens", from: 11, to: 21, label: "Athens" },
      { place: "philippi", from: 10.5, to: 21, label: "Philippi" },
      { place: "jerusalem", from: 13, to: 21, label: "Jerusalem" },
      { place: "malta", from: 20.5, to: 26, label: "Malta" },
      { place: "rome", from: 21, to: 26, label: "Rome", big: true },
    ],
    routes: [
      { points: ["jerusalem", [35.6, 32.6], "damascus"], from: 0.3, to: 2.2, color: GOLD },
      { points: ["antioch", "seleucia", "salamis", "paphos", "perga", "pisidianAntioch", "iconium", "lystra", "derbe", "lystra", "iconium", "pisidianAntioch", "perga", "attalia", "antioch"], from: 4.5, to: 9, color: GOLD, arc: 0.3 },
      { points: ["antioch", "tarsus", "derbe", "lystra", "iconium", "pisidianAntioch", [29.5, 39.4], "troas", "neapolis", "philippi", "thessalonica", "berea", "athens", "corinth", "ephesus", "caesarea", "jerusalem", "antioch"], from: 9.5, to: 15, color: PALE, arc: 0.3 },
      { points: ["antioch", "iconium", "pisidianAntioch", "ephesus", "troas", "philippi", "thessalonica", "corinth", "philippi", "troas", "miletus", "rhodes", "tyre", "caesarea", "jerusalem"], from: 15.3, to: 20, color: GREEN, arc: 0.3 },
      { points: ["caesarea", "sidon", "myra", "fairHavens", "malta", "syracuse", "rhegium", "puteoli", "rome"], from: 20.3, to: 25, color: EMBER, arc: 0.5 },
    ],
    labels: [
      { text: "First journey", at: [33, 35.4], from: 5, to: 9.5 },
      { text: "Second journey", at: [24.5, 39.2], from: 10, to: 15.3 },
      { text: "Third journey", at: [27.6, 36.4], from: 15.5, to: 20 },
      { text: "The voyage to Rome", at: [19, 35.2], from: 20.5, to: 26 },
    ],
  },
};

export function create(ctx, spec) {
  const program = PROGRAMS[spec.program];
  if (!program) throw new Error(`no map program ${spec.program}`);
  return createMapScene(program, ctx);
}
