import { EmulatorsUi } from "./../emulators-ui";

import { MouseMode, MouseProps } from "./mouse";
import { Layers } from "../dom/layers";
import { CommandInterface } from "emulators";

export function initNullLayersControl(
    layers: Layers,
    ci: CommandInterface,
    emulatorsUi: EmulatorsUi) {

    const mouseProps: MouseProps = {
        pointerButton: 0,
        mode: MouseMode.DEFAULT,
    };

    const unbindKeyboard = emulatorsUi.controls.keyboard(layers, ci);
    const unbindMouse = emulatorsUi.controls.mouse(layers, ci, mouseProps);
    const unbindOptions = emulatorsUi.controls.options(layers, ["default"], () => {/**/});

    return () => {
        unbindKeyboard();
        unbindMouse();
        unbindOptions();
    };
}
