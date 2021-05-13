import { EmulatorsUi } from "./../emulators-ui";

import { MouseMode, MouseProps } from "./mouse";
import { Layers } from "../dom/layers";
import { CommandInterface } from "emulators";
import { LayersConfig, LayerConfig, LayerKeyControl } from "./layers-config";
import { getGrid } from "./grid";
import { createButton } from "./button";

export function initLayersControl(
    layers: Layers,
    layersConfig: LayersConfig,
    ci: CommandInterface,
    emulatorsUi: EmulatorsUi) {
    return initLayerConfig(Object.values(layersConfig.layers)[0], layers, ci, emulatorsUi);
}

function initLayerConfig(layerConfig: LayerConfig,
                         layers: Layers,
                         ci: CommandInterface,
                         emulatorsUi: EmulatorsUi) {
    const mouseProps: MouseProps = {
        pointerButton: 0,
        mode: MouseMode.DEFAULT,
    };

    const unbindKeyboard = emulatorsUi.controls.keyboard(layers, ci);
    const unbindMouse = emulatorsUi.controls.mouse(layers, ci, mouseProps);

    const unbindControls: (() => void)[] = [];
    function onResize(width: number, height: number) {
        for (const next of unbindControls) {
            next();
        }
        unbindControls.splice(0, unbindControls.length);

        const grid = getGrid(layerConfig.grid);
        const { cells, columnWidth, rowHeight, columnsPadding, rowsPadding } = grid.getConfiguration(width, height);
        for (const next of layerConfig.controls) {
            const { row, column, type } = next;
            const { centerX, centerY } = cells[row][column];

            if (type === "Key") {
                const keyControl = next as LayerKeyControl;
                const button = createButton(keyControl.symbol, {
                    onDown: () => ci.sendKeyEvent(keyControl.mapTo, true),
                    onUp: () => ci.sendKeyEvent(keyControl.mapTo, false),
                }, columnWidth);

                button.style.position = "absolute";
                button.style.left = (centerX - columnWidth / 2) + "px";
                button.style.top = (centerY - rowHeight / 2) + "px";

                layers.mouseOverlay.appendChild(button);
                unbindControls.push(() => {
                    layers.mouseOverlay.removeChild(button);
                });
            }

        }
    }

    layers.addOnResize(onResize);
    onResize(layers.width, layers.height);

    return () => {
        layers.removeOnResize(onResize);
        unbindKeyboard();
        unbindMouse();
        for (const next of unbindControls) {
            next();
        }
    };
}
