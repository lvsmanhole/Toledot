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

  // ---- chapters 6–11. The many angels of the seals and trumpets are the approved bronze angel; these are new.
  // the four horsemen (6:1–8): each horse and its rider is one model
  horseWhite: { ...c("6:2", ["a white horse", "he that sat on him had a bow", "a crown was given unto him", "going forth conquering"],
    "A warrior riding a white war horse striding forward, the rider a dark-skinned Middle Eastern man holding a bow, a plain gold crown on his head, a short crimson cloak; horse and rider together, side view.", 30000),
    status: "approved", sha256: "8ddb9519c275adaebde94a33df0aca765f01c87147acd30c3624366bf804a7cf", yaw: Math.PI / 2 },
  horseRed: { ...c("6:4", ["a horse that was red", "he that sat thereon", "a great sword"],
    "A warrior riding a deep red war horse at a gallop, the rider a dark-skinned African man in bronze scale armour holding up a great broad sword; horse and rider together, side view.", 30000),
    status: "approved", sha256: "38bec392197038d67bdff4d02ec40bd5f97c09b75269d4fac9a85c83ad00bbec", yaw: Math.PI / 2 },
  horseBlack: { ...c("6:5", ["a black horse", "he that sat on him had a pair of balances in his hand"],
    "A rider on a black horse walking, the rider a gaunt dark-skinned man in a dark wool mantle holding up a pair of bronze balance scales in one hand; horse and rider together, side view.", 30000),
    status: "approved", sha256: "032c4a182b70ad47fdc8c967d618eb9e3e7a1ba4b17ce7709dc0f92ba1ec3ce7", yaw: Math.PI / 2 },
  horsePale: { ...c("6:8", ["a pale horse, ashen grey-green", "the rider named Death: gaunt, hooded, his face in shadow"],
    "A gaunt hooded rider in a tattered ash-grey shroud, his face hidden in shadow, on a thin pale ashen grey-green horse, walking; horse and rider together, side view; solemn, not gory.", 30000,
    ["Hell followed with him"]),
    status: "approved", sha256: "cbe28179cd2e84987f3f51022522db52eb48e3c30e8d62d6234d7e66f8baabed", yaw: Math.PI / 2 },
  // the locusts out of the smoke of the pit (9:7–10): one model, many in the swarm
  locust: { ...c("9:7-10", ["shaped like a horse prepared unto battle", "on its head as it were a crown like gold", "a face as the face of a man",
    "hair as the hair of women", "teeth as the teeth of lions", "a breastplate as it were of iron", "wings", "a tail like unto a scorpion, with a sting"],
  "A winged war beast with the body of an armoured horse but the head of a bearded human man: a human face with human eyes, human nose and human mouth showing lion's fangs, long flowing dark hair like a woman's, a gold crown, veined locust wings, an iron breastplate, a scorpion's tail curling up with a sting; side view.", 9000),
    status: "approved", sha256: "652c2ec0856ca47c9c62c1b4f306537a13063679e35927a480725081fd2db241", yaw: Math.PI / 2 },
  // the horses of the army of two hundred thousand thousand (9:16–19), with their riders: one model, many
  lionHorse: { ...c("9:17-19", ["the heads of the horses as the heads of lions", "tails like unto serpents, having heads",
    "riders having breastplates of fire, and of jacinth, and brimstone"],
  "A war horse with the head of a roaring lion with a full mane, its tail a long serpent ending in a snake's head, ridden by an armoured rider whose breastplate is fiery red, deep blue and sulphur yellow; horse and rider together, side view.", 9000,
  ["out of their mouths issued fire and smoke and brimstone"]),
    status: "approved", sha256: "14d3efd587dfd263a30514e8c3becb9aa9d1359566906d52797b44b2de4ea50f", yaw: Math.PI / 2 },
  // the king of the locusts, the angel of the bottomless pit (9:11): a brazen being, darkened
  abaddon: { ...c("9:11", ["the angel of the bottomless pit", "a king over the locusts", "fearsome: a being of blackened bronze, darkened as by smoke", "great wings"],
    "A towering dark angelic king of blackened bronze and soot-dark iron, great ragged wings of smoke-dark bronze feathers, a jagged iron crown, eyes like embers, a stern face, standing; dread and majestic, not a cartoon demon, no horns.", 15000),
    status: "approved", sha256: "4ce1d06fbbc762d1a49ddfd16b430d2104b5c0f2aee871bd4a3813666f323ab3" },
  // the two witnesses (11:3–12), of different peoples
  witness: { ...c("11:3", ["a prophet clothed in sackcloth", "deep dark brown African skin"],
    "An old African prophet standing, deep dark brown skin, grey beard, in a rough coarse dark goat-hair sackcloth robe tied with a cord, barefoot, hands open at his sides.", 12000),
    status: "approved", sha256: "73af9828336c45569b8b73cf934db788aa7e09bdcbda231a64988a3554af668b" },
  witnessB: { ...c("11:3", ["a prophet clothed in sackcloth", "dark olive-brown Middle Eastern skin"],
    "A Middle Eastern prophet standing, dark olive-brown skin, black beard streaked grey, in a rough coarse dark goat-hair sackcloth robe tied with a cord, barefoot, hands open at his sides.", 12000),
    status: "approved", sha256: "8314936c4d1ec7e288d7fa97ad457584accbee0bfb116d57d7da7253b41f8c3b" },
  // the idols of 9:20: one carved image, which the scene gives in each of the five materials
  idol: { ...c("9:20", ["an idol: a carved image of a god, which neither can see, nor hear, nor walk"],
    "A small ancient Near Eastern idol statue of a stiff seated god on a square block, blank carved eyes, carved in plain grey stone, alone; nothing else in frame.", 4000,
    ["of gold, and silver, and brass, and stone, and of wood"]),
    status: "approved", sha256: "48b2a8867a8bbf6916d544c68182e0b7521c852f554837cb2420a262d77f79b0" },
};

/** How many of each model the throne room shows at once (kit/heaven.js, scenes/lamb.js): its heaviest scene. */
export const ROOM = {
  elder: 8, elderB: 8, elderC: 8, crown: 24, beastLion: 1, beastCalf: 1, beastMan: 1, beastEagle: 1,
  lamb: 1, angel: 1, sealedBook: 1, harp: 12, goldenVial: 12,
};
/** Triangle limits for the throne room: desktop (by budgets) and phone (measured on the phone copies). */
export const ROOM_LIMITS = { desktop: 900000, phone: 300000 };
