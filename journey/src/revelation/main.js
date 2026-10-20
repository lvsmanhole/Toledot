// The Revelation: the vision of John on Patmos, chapters 1 to 22. Same director as the Journey, no Chronicle.
import { runDirector } from "../director.js";
import { MODULES } from "./scenes/index.js";
import * as story from "./story.js";

runDirector({ story, modules: MODULES, chronicle: null, libBase: "../lib/", header: "AD 95 · Patmos" });
