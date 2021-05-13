import { EmulatorsUi } from "./../emulators-ui";

import { LegacyLayersConfig } from "./layers-config";
import { MouseMode, MouseProps } from "./mouse";
import { Layers } from "../dom/layers";
import { CommandInterface } from "emulators";

export function initLegacyLayersControl(
    layers: Layers,
    layersConfig: LegacyLayersConfig,
    ci: CommandInterface,
    emulatorsUi: EmulatorsUi) {
    const layersNames = Object.keys(layersConfig);

    const unbind = {
        keyboard: () => {/**/},
        mouse: () => {/**/},
        gestures: () => {/**/},
        buttons: () => {/**/},
    };

    const changeControlLayer = (layerName: string) => {
        unbind.keyboard();
        unbind.mouse();
        unbind.gestures();
        unbind.buttons();

        unbind.keyboard = () => {/**/};
        unbind.mouse = () => {/**/};
        unbind.gestures = () => {/**/};
        unbind.buttons = () => {/**/};

        const layer = layersConfig[layerName];
        if (layer === undefined) {
            return;
        }

        const mouseProps: MouseProps = {
            pointerButton: 0,
            mode: MouseMode.DEFAULT,
        };

        unbind.keyboard = emulatorsUi.controls.keyboard(layers, ci, layer.mapper);

        if (layer.gestures !== undefined && layer.gestures.length > 0) {
            unbind.gestures = emulatorsUi.controls.nipple(layers, ci, layer.gestures);
        } else {
            unbind.mouse = emulatorsUi.controls.mouse(layers, ci, mouseProps);
        }

        if (layer.buttons !== undefined && layer.buttons.length) {
            unbind.buttons = emulatorsUi.controls.button(layers, ci, layer.buttons, mouseProps, 54);
        }
    }


    const unbindOptions = emulatorsUi.controls.options(layers, layersNames, changeControlLayer, 54, 54 / 4, 0);
    changeControlLayer("default");

    return () => {
        unbind.gestures();
        unbind.buttons();
        unbind.mouse();
        unbind.keyboard();
        unbindOptions();
    };
}
