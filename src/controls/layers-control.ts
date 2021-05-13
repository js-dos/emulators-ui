import { EmulatorsUi } from "./../emulators-ui";

import { MouseMode, MouseProps } from "./mouse";
import { Layers } from "../dom/layers";
import { CommandInterface } from "emulators";
import { LayersConfig, LayerConfig, LayerKeyControl, LayerControl } from "./layers-config";
import { getGrid, GridConfiguration } from "./grid";
import { createButton } from "./button";

export function initLayersControl(
    layers: Layers,
    layersConfig: LayersConfig,
    ci: CommandInterface,
    emulatorsUi: EmulatorsUi) {
    return initLayerConfig(Object.values(layersConfig.layers)[0], layers, ci, emulatorsUi);
}

type ControlFactory = (keyControl: any,
                       layers: Layers,
                       ci: CommandInterface,
                       gridConfig: GridConfiguration,
                       emulatorsUi: EmulatorsUi) => () => void;

const factoryMapping: {[type: string]: ControlFactory} = {
    Key: createKeyControl,
    Options: createOptionsControl,
};

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
        const gridConfig = grid.getConfiguration(width, height);
        for (const next of layerConfig.controls) {
            const factory = factoryMapping[next.type];
            if (factory === undefined) {
                console.error("Factory for control '" + next.type + "' is not defined");
                continue;
            }

            const unbind = factory(next, layers, ci, gridConfig, emulatorsUi);
            unbindControls.push(unbind);
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

function createKeyControl(keyControl: LayerKeyControl,
                          layers: Layers,
                          ci: CommandInterface,
                          gridConfig: GridConfiguration,
                          emulatorsUi: EmulatorsUi) {
    const { cells, columnWidth, rowHeight } = gridConfig;
    const { row, column } = keyControl;
    const { centerX, centerY } = cells[row][column];

    const button = createButton(keyControl.symbol, {
        onDown: () => ci.sendKeyEvent(keyControl.mapTo, true),
        onUp: () => ci.sendKeyEvent(keyControl.mapTo, false),
    }, columnWidth);

    button.style.position = "absolute";
    button.style.left = (centerX - columnWidth / 2) + "px";
    button.style.top = (centerY - rowHeight / 2) + "px";

    layers.mouseOverlay.appendChild(button);
    return () => layers.mouseOverlay.removeChild(button);
}

function createOptionsControl(keyControl: LayerControl,
                              layers: Layers,
                              ci: CommandInterface,
                              gridConfig: GridConfiguration,
                              emulatorsUi: EmulatorsUi) {
    const { cells, columnWidth, rowHeight } = gridConfig;
    const { row, column } = keyControl;
    const { centerX, centerY } = cells[row][column];

    const top = centerY - rowHeight / 2;
    const left = centerX - columnWidth / 2;
    const right = gridConfig.width - left - columnWidth;

    return emulatorsUi.controls.options(layers, ["default"], () => {},
                                        columnWidth,
                                        top,
                                        right);
}
