// The photographic assets the journey uses, all CC0 from Poly Haven. Keys are what the code refers to.

// sky panoramas ("pure skies": no ground or modern objects in them), one per lighting preset
export const HDRIS = {
  dawn: { id: "qwantani_dawn_puresky", res: "2k" },
  morning: { id: "qwantani_mid_morning_puresky", res: "2k" },
  noon: { id: "qwantani_noon_puresky", res: "2k" },
  desert: { id: "kloofendal_43d_clear_puresky", res: "2k" },
  golden: { id: "qwantani_late_afternoon_puresky", res: "2k" },
  dusk: { id: "qwantani_dusk_2_puresky", res: "2k" },
  night: { id: "qwantani_night_puresky", res: "2k" },
  storm: { id: "kloofendal_overcast_puresky", res: "2k" },
  ash: { id: "overcast_soil_puresky", res: "2k" },
  sacred: { id: "kloofendal_misty_morning_puresky", res: "2k" },
};

// PBR surface textures: diffuse, normal (GL), and AO/roughness/metal maps
export const TEXTURES = {
  grass: { id: "sparse_grass" },
  dryGrass: { id: "withered_grass" },
  sand: { id: "coast_sand_01" },
  dryGround: { id: "dry_ground_01" },
  rock: { id: "aerial_rocks_02" },
  cliff: { id: "rock_boulder_dry" },
  mud: { id: "brown_mud_dry" },
  cracked: { id: "mud_cracked_dry_03" },
  burned: { id: "burned_ground_01" },
  mudBrick: { id: "clay_block_wall" },
  plaster: { id: "clay_plaster" },
  sandstone: { id: "sandstone_blocks_08" },
  limestone: { id: "white_sandstone_blocks_02" },
  darkRock: { id: "dark_rock" },
  planks: { id: "brown_planks_05" },
  bark: { id: "bark_brown_02" },
  linen: { id: "rough_linen" },
};

// scanned models
export const MODELS = {
  tree1: { id: "island_tree_01", ratio: 0.012, leaves: true },
  tree2: { id: "island_tree_02", ratio: 0.012, leaves: true },
  boulder1: { id: "namaqualand_boulder_02" },
  boulder2: { id: "namaqualand_boulder_04" },
  boulder3: { id: "namaqualand_boulder_05" },
  rocks: { id: "namaqualand_rocks_01" },
  cliff: { id: "namaqualand_cliff_02", ratio: 0.08 },
  grassClump: { id: "grass_medium_01" },
  deadTrunk: { id: "dead_tree_trunk_02" },
  shrub: { id: "othonna_cerarioides" },
};
