// The Revelation: the vision of John on Patmos, chapters 1 to 22. Same director as the Journey, no Chronicle.
import { runDirector } from "../director.js";
import { MODULES } from "./scenes/index.js";
import * as story from "./story.js";

const card = story.endCard(story.BUILT);
document.querySelector("#end .end-kicker").textContent = card.kicker;
document.querySelector("#end .end-line").textContent = card.line;

runDirector({ story, modules: MODULES, chronicle: null, libBase: "../lib/", header: "AD 95 · Patmos" });
