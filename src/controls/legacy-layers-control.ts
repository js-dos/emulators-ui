import { LegacyLayersConfig } from "./layers-config";
import { Layers } from "../dom/layers";
import { CommandInterface } from "emulators";
import { deprecatedButton } from "./button";
import { mouse } from "./mouse";
import { nipple } from "./nipple";
import { options } from "./options";
import { keyboard } from "./keyboard";

export function initLegacyLayersControl(
    layers: Layers,
    layersConfig: LegacyLayersConfig,
    ci: CommandInterface) {
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

        unbind.keyboard = keyboard(layers, ci, layer.mapper);

        if (layer.gestures !== undefined && layer.gestures.length > 0) {
            unbind.gestures = nipple(layers, ci, layer.gestures);
        } else {
            unbind.mouse = mouse(layers, ci);
        }

        if (layer.buttons !== undefined && layer.buttons.length) {
            unbind.buttons = deprecatedButton(layers, ci, layer.buttons, 54);
        }
    }


    const unbindOptions = options(layers, layersNames, changeControlLayer, 54, 54 / 4, 0);
    changeControlLayer("default");

    return () => {
        unbind.gestures();
        unbind.buttons();
        unbind.mouse();
        unbind.keyboard();
        unbindOptions();
    };
}
