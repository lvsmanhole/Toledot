// The Journey: Genesis to Revelation, with the Chronicle (the Toledot timeline) along the bottom.
import { runDirector } from "./director.js";
import { MODULES } from "./scenes/index.js";
import * as story from "./story.js";

runDirector({ story, modules: MODULES, chronicle: { data: "data/core.json" }, libBase: "lib/", header: null });
