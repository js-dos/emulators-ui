import { Layers } from "../dom/layers";
import { CommandInterface } from "emulators";
import { keyboard } from "./keyboard";
import { mouse } from "./mouse";
import { options } from "./options";

export function initNullLayersControl(
    layers: Layers,
    ci: CommandInterface) {

    const unbindKeyboard = keyboard(layers, ci);
    const unbindMouse = mouse(layers, ci);
    const unbindOptions = options(layers, ["default"], () => {/**/}, 54, 54 / 4, 0);

    return () => {
        unbindKeyboard();
        unbindMouse();
        unbindOptions();
    };
}
