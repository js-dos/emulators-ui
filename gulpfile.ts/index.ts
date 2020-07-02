import { parallel } from "gulp";
import { emulatorsUi } from "./emulators-ui";
import { emitTypes } from "./types";

exports.default = parallel(emulatorsUi, emitTypes);


