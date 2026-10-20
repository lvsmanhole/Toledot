// The creatures and figures of the Revelation that are generated 3D models (fal.ai, see
// scripts/creatures.mjs). Each one names its verse and the features the text gives it; the user approves
// each model against that list before it is shown ("approved"). Until then scenes show a stand-in.

/** One look for every model, so dozens of generated creatures read as one world. */
export const STYLE =
  "A single subject on a plain neutral grey background, full figure, centred, even soft studio light, " +
  "no cast shadow. Ancient Near Eastern, first century, reverent and luminous; real materials: gold, " +
  "bronze, linen, wool, fleece, feather, stone. Painterly realism, not cartoon, not toy, not anime. " +
  "No text, no letters, no gore, no blood, no nudity.";

/**
 * fal.ai endpoints and prices, checked 2026-10-20 on fal.ai/models/<endpoint>/llms.txt. `ceiling` is the
 * total the user agreed to spend (dollars); null until they agree one, and nothing is generated before.
 */
export const PRICES = {
  checked: "2026-10-20",
  image: { endpoint: "fal-ai/flux-2-pro", each: 0.03, input: { image_size: "square_hd", output_format: "png" } },
  mesh: { endpoint: "fal-ai/trellis-2", each: 0.3, input: { resolution: 1024, texture_size: 1024 } },
  ceiling: 22,
};

// tris: the model's triangle budget on desktop. Phones get a simplified copy (scripts/fetch-assets.mjs); Trellis
// splits vertices along texture seams, so how far a copy shrinks varies, and the whole throne room is what is
// checked (ROOM). Things placed many times over in one
// scene (the elders, their seats and crowns, the wings) get small budgets so the whole scene fits a phone.
// drawn: what the text gives that the scene adds as light, not part of the model (kept out of the prompt).
// An approved model also records sha256 (the file the user approved) and yaw (radians about y that turn the
// model to face as its stand-in does).
const c = (verse, features, prompt, tris, drawn = []) => ({ verse, features, drawn, prompt, tris, status: "pending", source: "generated", cost: 0 });

export const CREATURES = {
  // the people of the vision are of the peoples of the text's world: mostly darker Middle Eastern and African
  john: { ...c("1:9", ["an old man", "dark olive-brown Middle Eastern skin", "white beard", "a plain undyed wool robe and mantle of an exile", "a wooden staff"],
    "An old Middle Eastern man in exile, deep olive-brown weathered skin, standing on rocks, holding a staff.", 30000),
    status: "approved", sha256: "65d73f7b53c256fef603467d7d2350e10f2bc2fd308165b38dede33c545c3064" },
  // the burning feet, seven stars, the sword and the countenance are light the scene adds (drawn); the eyes of
  // fire are in the model, and the scene's flames brighten them
  sonOfMan: { ...c("1:13-16", [
    "clothed with a garment down to the foot (white)", "girt about the paps with a golden girdle",
    "his head and his hairs white like wool, as white as snow", "skin of dark burnished bronze",
    "his eyes as a flame of fire", "fierce", "bare feet of burnished bronze", "right hand open, palm up and empty",
  ], "A tall fierce man standing, skin of dark burnished bronze, in a white floor-length linen robe with a golden band high across the chest, hair white as wool, eyes glowing like flames of fire, a stern piercing gaze, bare feet of polished bronze, right hand held out open, nothing in his hands.", 40000,
  ["his feet like unto fine brass, as if they burned in a furnace", "in his right hand seven stars",
    "out of his mouth a sharp two-edged sword", "his countenance as the sun shineth in his strength"]),
    status: "approved", sha256: "e4eb38f898746ff9893b84185b5440def9e653027cd9765af5806e53b3cb94e4" },
  // the elder's crown of gold is its own model ("crown"), set on his head in the scene: he casts it down (4:10).
  // Three elders of different peoples, each placed eight times round the throne.
  elder: { ...c("4:4", ["clothed in white raiment", "seated", "bareheaded", "deep dark brown African skin"],
    "An old African man seated, deep dark brown skin, white beard, in white raiment, bareheaded, hands on his knees, nothing under him.", 8700),
    status: "approved", sha256: "66c505cfeca64902388028b62d4c63c16d53bb2b561b84d81bdccfa823a08a4a" },
  elderB: { ...c("4:4", ["clothed in white raiment", "seated", "bareheaded", "dark olive-brown Middle Eastern skin"],
    "An old Middle Eastern man seated, dark olive-brown skin, grey beard, in white raiment, bareheaded, hands on his knees, nothing under him.", 8700),
    status: "approved", sha256: "2d7852da2d8d94fb56ae4e13777289735e6d8a3de9b6cf6e429b4f05c5bc0090" },
  elderC: { ...c("4:4", ["clothed in white raiment", "seated", "bareheaded", "warm brown North African skin"],
    "An old North African man seated, warm brown skin, white beard, in white raiment, bareheaded, hands on his knees, nothing under him.", 8700),
    status: "approved", sha256: "27b3d7a6951d47a9e77aa0c4c983da6ad18a485d9f0fc6779ad01f87dcac985f" },
  crown: { ...c("4:10", ["a crown of gold"], "A simple ancient circlet crown of hammered gold, alone.", 1500),
    status: "approved", sha256: "d6e41a89b982d36adb877e695902b235dcb500feb170d4377ef57b5b4848a5cb" },
  beastLion: { ...c("4:7", ["like a lion", "full of eyes before and behind"],
    "A great lion, standing, its coat set with many open eyes, majestic and calm.", 29000),
    status: "approved", sha256: "9ab64b4149c43cee024db69387401d16cc5765b378fd20fe36b85f12171fad26" },
  beastCalf: { ...c("4:7", ["like a calf", "full of eyes before and behind"],
    "A young ox calf, standing, its hide set with many open eyes, calm.", 29000),
    status: "approved", sha256: "003bb335ed331e314559f291eb5813f7b6c60d0e8a873f431573cb363264d53b" },
  beastMan: { ...c("4:7", ["a living creature that had a face as a man", "full of eyes before and behind"],
    "A great winged living creature with the calm face of a man, its body set with many open eyes; not a human.", 29000),
    status: "approved", sha256: "4149a671e332ee2ec1df5e851be6552db14037413c0de425fd7b89f084621e71" },
  beastEagle: { ...c("4:7", ["like a flying eagle", "full of eyes before and behind"],
    "A great eagle in flight, wings spread, its feathers set with many open eyes.", 29000),
    status: "approved", sha256: "33588c04c940f689e754c65a13ddfe471ace5576f404b45b5b358f132aa88cf4" },
  // "as it had been slain" is shown by the scene's light on the neck, not a wound in the model (all ages)
  lamb: { ...c("5:6", ["a white lamb, standing", "having seven horns set in a ring around its head like a crown"],
    "A white sheep standing in profile, woolly fleece, with seven short golden horns set in a ring around its head like a crown.", 18500,
    ["as it had been slain", "and seven eyes"]),
    status: "approved", sha256: "f863c7022fc033b7112b32621b152bc7822f8ccf1000437eea3d96049a32c7be", yaw: Math.PI / 2 },
  // not a gentle white angel: a fearsome divine being, brazen, as burnished bronze
  angel: { ...c("5:2", ["a strong angel", "a brazen being: body and face as burnished bronze", "great wings", "no halo", "fearsome, not gentle"],
    "A towering, awe-inspiring heavenly messenger whose whole body and stern face gleam like burnished bronze, eyes blazing with light, vast wings of bronze and gold feathers, a plain linen robe, standing tall, one arm raised to proclaim; majestic and formidable, not gentle, not a cherub, no halo.", 15000),
    // bronze bakes poorly at 1024 px; packing still ships 1024
    mesh: { texture_size: 2048 }, status: "approved", sha256: "0f140659d6b8bc6e7e4d7a8b335413f0d471671a331d7c3258c699b10f557b6b" },
  sealedBook: { ...c("5:1", ["a book (scroll) written within and on the backside", "sealed with seven seals"],
    "An ancient rolled scroll written on both sides, bound shut with seven wax seals along its edge, lying alone; nothing else in frame, no cloth, no feathers, no stones.", 3000),
    status: "approved", sha256: "f6919a860922db6ac823dc143eb3210ed354a46e70662390908edd0aafc06faa" },
  harp: { ...c("5:8", ["a harp (an ancient lyre)"], "An ancient wooden lyre with gold fittings and gut strings, standing alone; nothing else in frame, no cloth, no feathers, no stones.", 2000),
    status: "approved", sha256: "c09c8717f128b3552a6924958b535bcf5ab731b13ee4151fd8186bec45e569f5" },
  goldenVial: { ...c("5:8", ["a golden vial (a wide shallow bowl) full of odours"], "A wide shallow bowl of gold heaped with incense, alone; no smoke, nothing else in frame.", 3200),
    status: "approved", sha256: "c30598a16458291eaacb18c7849eee63bdd2c2f0b73da2a6b1f0b653dc0a457b" },
  keys: { ...c("1:18", ["the keys of hell and of death"], "Two large ancient iron keys on a ring, alone; nothing else in frame, no cloth, no feathers, no stones.", 1500),
    status: "approved", sha256: "5bfbe63e78cc9f10b5582143208c8a6e1ae7761ce2fb973fc3bece06a2ceaa48" },
};

/** How many of each model the throne room shows at once (kit/heaven.js, scenes/lamb.js): its heaviest scene. */
export const ROOM = {
  elder: 8, elderB: 8, elderC: 8, crown: 24, beastLion: 1, beastCalf: 1, beastMan: 1, beastEagle: 1,
  lamb: 1, angel: 1, sealedBook: 1, harp: 12, goldenVial: 12,
};
/** Triangle limits for the throne room: desktop (by budgets) and phone (measured on the phone copies). */
export const ROOM_LIMITS = { desktop: 900000, phone: 300000 };
