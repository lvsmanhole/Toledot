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
  ceiling: null,
};

// tris: the model's triangle budget on desktop (phones get a third). Things placed many times over in one
// scene (the elders, their seats and crowns, the wings) get small budgets so the whole scene fits a phone.
const c = (verse, features, prompt, tris) => ({ verse, features, prompt, tris, status: "pending", source: "generated", cost: 0 });

export const CREATURES = {
  john: c("1:9", ["an old man", "white beard", "a plain undyed wool robe and mantle of an exile", "a wooden staff"],
    "An old man in exile, weathered, standing on rocks, holding a staff.", 30000),
  johnHands: c("1:17", ["two old weathered forearms and hands", "loose undyed wool sleeves to the wrist", "seen from the owner's own eyes"],
    "A pair of old weathered human forearms and open hands, palms down, as seen in first person, cut off below the elbow.", 8000),
  sonOfMan: c("1:13-16", [
    "clothed with a garment down to the foot", "girt about the paps with a golden girdle",
    "his head and his hairs white like wool, as white as snow", "his eyes as a flame of fire",
    "his feet like unto fine brass, as if they burned in a furnace", "in his right hand seven stars",
    "out of his mouth a sharp two-edged sword", "his countenance as the sun shineth in his strength (a face of pure light, no features)",
  ], "A tall man in a white floor-length robe with a golden band across the chest, standing, right hand held out.", 40000),
  // the elder's crown of gold is its own model ("crown"), set on his head in the scene: he casts it down (4:10)
  elder: c("4:4", ["clothed in white raiment", "seated", "bareheaded"],
    "An old man seated, in white raiment, bareheaded, hands on his knees.", 12000),
  elderSeat: c("4:4", ["a seat (throne) for an elder", "stone and gold"],
    "A single ancient carved seat of pale stone inlaid with gold, empty.", 3000),
  crown: c("4:10", ["a crown of gold"], "A simple ancient circlet crown of hammered gold, alone.", 1500),
  beastLion: c("4:7", ["like a lion", "full of eyes before and behind"],
    "A great lion, standing, its coat set with many open eyes, majestic and calm.", 30000),
  beastCalf: c("4:7", ["like a calf", "full of eyes before and behind"],
    "A young ox calf, standing, its hide set with many open eyes, calm.", 30000),
  beastMan: c("4:7", ["a living creature that had a face as a man", "full of eyes before and behind"],
    "A great winged living creature with the calm face of a man, its body set with many open eyes; not a human.", 30000),
  beastEagle: c("4:7", ["like a flying eagle", "full of eyes before and behind"],
    "A great eagle in flight, wings spread, its feathers set with many open eyes.", 30000),
  wingEyes: c("4:8", ["one great wing", "full of eyes within"],
    "A single great feathered wing, detached, its feathers set with many open eyes, spread flat.", 2500),
  lamb: c("5:6", ["a Lamb as it had been slain (a healed wound on the neck, no blood)", "having seven horns", "and seven eyes"],
    "A white lamb standing, with seven small horns and seven eyes, a healed scar at the neck.", 20000),
  angel: c("5:2", ["a strong angel", "a robed man with great wings", "no halo", "face bright with light"],
    "A tall strong angel in a white robe with great white wings, standing, arm raised to proclaim.", 25000),
  sealedBook: c("5:1", ["a book (scroll) written within and on the backside", "sealed with seven seals"],
    "An ancient rolled scroll written on both sides, bound shut with seven wax seals along its edge.", 3000),
  harp: c("5:8", ["a harp (an ancient lyre)"], "An ancient wooden lyre with gold fittings and gut strings.", 2000),
  goldenVial: c("5:8", ["a golden vial (a wide shallow bowl) full of odours"], "A wide shallow bowl of gold with incense smoke rising.", 1500),
  keys: c("1:18", ["the keys of hell and of death"], "Two large ancient iron keys on a ring.", 1500),
};
