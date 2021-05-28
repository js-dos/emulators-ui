import { Button } from "./button";
import { EventMapping } from "./nipple";
import { Mapper } from "./keyboard";

import { GridType } from "./grid";

export type LayerControlType = "Options" | "Key" | "Keyboard" | "Switch" | "ScreenMove" | "PointerButton";

export interface LayerPosition {
    column: number;
    row: number;
}

export interface LayerControl extends LayerPosition {
    type: LayerControlType,
    symbol: string;
}

export interface LayerKeyControl extends LayerControl {
    mapTo: number;
}

export interface LayerSwitchControl extends LayerControl {
    layerName: string,
}

export interface LayerScreenMoveControl extends LayerControl {
    direction: "up" | "down" | "left" | "right" |
        "up-left" | "up-right" | "down-left" | "down-right";
}

export interface LayerPointerButtonControl extends LayerControl {
    button: 0 | 1;
}

export interface LayerConfig {
    grid: GridType,
    title: string,
    controls: LayerControl[],
}

export interface LayersConfig {
    version: number,
    layers: LayerConfig[],
}


export interface LegacyLayerConfig {
    name: string,
    buttons: Button[],
    gestures: EventMapping[],
    mapper: Mapper,
};

export type LegacyLayersConfig = {[index: string]: LegacyLayerConfig};

export function extractLayersConfig(config: any): LayersConfig | LegacyLayersConfig | null {
    if (config.layersConfig !== undefined) {
        return config.layersConfig;
    }

    if (config.layers !== undefined) {
        return config.layers;
    }

    return null;
}
