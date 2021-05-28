import { EmulatorsUi } from "./../emulators-ui";

import { MouseMode, MouseProps } from "./mouse";
import { Layers } from "../dom/layers";
import { CommandInterface } from "emulators";
import { LayersConfig, LayerConfig, LayerKeyControl, LayerControl, LayerSwitchControl, LayerScreenMoveControl } from "./layers-config";
import { getGrid, GridConfiguration } from "./grid";
import { createButton } from "./button";
import { DosInstance } from "../js-dos";

export function initLayersControl(
    layers: Layers,
    layersConfig: LayersConfig,
    ci: CommandInterface,
    dosInstance: DosInstance,
    layerName?: string) {
    let selectedLayer = layersConfig.layers[0];
    if (layerName !== undefined) {
        for (const next of layersConfig.layers) {
            if (next.title === layerName) {
                selectedLayer = next;
                break;
            }
        }
    }
    return initLayerConfig(selectedLayer, layers, ci, dosInstance);
}

type ControlFactory = (keyControl: any,
    layers: Layers,
    ci: CommandInterface,
    gridConfig: GridConfiguration,
    dosInstance: DosInstance) => () => void;

const factoryMapping: { [type: string]: ControlFactory } = {
    Key: createKeyControl,
    Options: createOptionsControl,
    Keyboard: createKeyboardControl,
    Switch: createSwitchControl,
    ScreenMove: createScreenMoveControl,
};

function initLayerConfig(layerConfig: LayerConfig,
    layers: Layers,
    ci: CommandInterface,
    dosInstance: DosInstance) {
    const mouseProps: MouseProps = {
        pointerButton: 0,
        mode: MouseMode.DEFAULT,
    };

    const emulatorsUi = dosInstance.emulatorsUi;
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

            const unbind = factory(next, layers, ci, gridConfig, dosInstance);
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
    dosInstance: DosInstance) {
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
    dosInstance: DosInstance) {
    const { cells, columnWidth, rowHeight } = gridConfig;
    const { row, column } = keyControl;
    const { centerX, centerY } = cells[row][column];
    const emulatorsUi = dosInstance.emulatorsUi;

    const top = centerY - rowHeight / 2;
    const left = centerX - columnWidth / 2;
    const right = gridConfig.width - left - columnWidth;

    return emulatorsUi.controls.options(layers, ["default"], () => {/**/},
        columnWidth,
        top,
        right);
}

function createKeyboardControl(keyboardControl: LayerControl,
    layers: Layers,
    ci: CommandInterface,
    gridConfig: GridConfiguration,
    dosInstance: DosInstance) {
    const { cells, columnWidth, rowHeight } = gridConfig;
    const { row, column } = keyboardControl;
    const { centerX, centerY } = cells[row][column];

    const button = createButton("keyboard", {
        onUp: () => layers.toggleKeyboard(),
    }, columnWidth);

    const onKeyboardVisibility = (visible: boolean) => {
        if (visible) {
            button.children[0].classList.add("emulator-control-close-icon");
        } else {
            button.children[0].classList.remove("emulator-control-close-icon");
        }
    };
    layers.setOnKeyboardVisibility(onKeyboardVisibility);

    button.style.position = "absolute";
    button.style.left = (centerX - columnWidth / 2) + "px";
    button.style.top = (centerY - rowHeight / 2) + "px";

    layers.mouseOverlay.appendChild(button);
    return () => {
        layers.mouseOverlay.removeChild(button);
        layers.removeOnKeyboardVisibility(onKeyboardVisibility);
    }
}

function createSwitchControl(switchControl: LayerSwitchControl,
    layers: Layers,
    ci: CommandInterface,
    gridConfig: GridConfiguration,
    dosInstance: DosInstance) {
    const { cells, columnWidth, rowHeight } = gridConfig;
    const { row, column } = switchControl;
    const { centerX, centerY } = cells[row][column];

    const button = createButton(switchControl.symbol, {
        onUp: () => dosInstance.setLayersConfig(dosInstance.getLayersConfig(), switchControl.layerName),
    }, columnWidth);

    button.style.position = "absolute";
    button.style.left = (centerX - columnWidth / 2) + "px";
    button.style.top = (centerY - rowHeight / 2) + "px";

    layers.mouseOverlay.appendChild(button);
    return () => {
        layers.mouseOverlay.removeChild(button);
    }
}

function createScreenMoveControl(screenMoveControl: LayerScreenMoveControl,
    layers: Layers,
    ci: CommandInterface,
    gridConfig: GridConfiguration,
    dosInstance: DosInstance) {
    const { cells, columnWidth, rowHeight } = gridConfig;
    const { row, column } = screenMoveControl;
    const { centerX, centerY } = cells[row][column];

    let mX = 0.5;
    let mY = 0.5;

    if (screenMoveControl.direction.indexOf("up") >= 0) {
        mY = 0;
    }

    if (screenMoveControl.direction.indexOf("down") >= 0) {
        mY = 1;
    }

    if (screenMoveControl.direction.indexOf("left") >= 0) {
        mX = 0;
    }

    if (screenMoveControl.direction.indexOf("right") >= 0) {
        mX = 1;
    }

    const button = createButton(screenMoveControl.symbol, {
        onDown: () => {
            ci.sendMouseMotion(mX, mY);
        },
        onUp: () => {
            ci.sendMouseMotion(0.5, 0.5);
        },
    }, columnWidth);

    button.style.position = "absolute";
    button.style.left = (centerX - columnWidth / 2) + "px";
    button.style.top = (centerY - rowHeight / 2) + "px";

    layers.mouseOverlay.appendChild(button);
    return () => {
        layers.mouseOverlay.removeChild(button);
    }
}