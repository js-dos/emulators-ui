import { Button } from "./button";
import { EventMapping } from "./nipple";
import { Mapper } from "./keyboard";

import { GridType } from "./grid";

export enum LayerControlType {
    Options = "Options",
    Key = "Key",
}

export interface LayerPosition {
    column: number;
    row: number;
}

export interface LayerControl extends LayerPosition {
    type: LayerControlType,
    symbol: string;
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
    if (config.layers !== undefined) {
        return config.layers;
    }

    return null;
}
