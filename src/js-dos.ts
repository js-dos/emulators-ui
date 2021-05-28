import { Emulators, CommandInterface } from "emulators";
import { TransportLayer } from "emulators/dist/types/protocol/protocol";
import { EmulatorsUi } from "./emulators-ui";
import { Layers, LayersOptions } from "./dom/layers";
import { Build } from "./build";

import { extractLayersConfig, LegacyLayersConfig, LayersConfig } from "./controls/layers-config";

import { initLegacyLayersControl } from "./controls/legacy-layers-control";
import { initNullLayersControl } from "./controls/null-layers-control";
import { initLayersControl } from "./controls/layers-control";

declare const emulators: Emulators;

export type EmulatorFunction = "dosboxWorker" | "dosboxDirect" | "dosboxNode" | "janus" | "backend";

export interface DosOptions {
    noWebGL?: boolean;
    emulatorFunction?: EmulatorFunction;
    clickToStart?: boolean;
    layersOptions?: LayersOptions;
    createTransportLayer?: () => TransportLayer;
}

export class DosInstance {
    static initialRun = true;

    emulatorsUi: EmulatorsUi;
    emulatorFunction: EmulatorFunction;
    createTransportLayer?: () => TransportLayer;
    layers: Layers;
    layersConfig: LayersConfig | LegacyLayersConfig | null = null;
    ciPromise?: Promise<CommandInterface>;

    options: DosOptions;

    private clickToStart: boolean;
    private unbindControls: () => void = () => {/**/};
    private storedLayersConfig: LayersConfig | LegacyLayersConfig | null = null;

    constructor(root: HTMLDivElement, emulatorsUi: EmulatorsUi, options: DosOptions) {
        if (DosInstance.initialRun) {
            emulators.cacheSeed += " ui (" + Build.short + ")";
            DosInstance.initialRun = false;
        }

        this.options = options;
        this.emulatorsUi = emulatorsUi;
        this.emulatorFunction = options.emulatorFunction || "dosboxWorker";
        this.clickToStart = options.clickToStart || false;
        this.layers = this.emulatorsUi.dom.layers(root, options.layersOptions);
        this.layers.showLoadingLayer();
        this.createTransportLayer = options.createTransportLayer;

        if (this.emulatorFunction === "backend" && this.createTransportLayer === undefined) {
            throw new Error("Emulator function set to 'backend' but 'createTransportLayer' is not a function");
        }
    }

    async run(bundleUrl: string, optionalChangesUrl?: string): Promise<CommandInterface> {
        await this.stop();
        this.layers.setLoadingMessage("Starting...");

        const persistKey = bundleUrl + ".changes";

        let ci: CommandInterface;
        try {
            ci = await this.runBundle(bundleUrl, optionalChangesUrl, persistKey);
        } catch (e) {
            this.layers.setLoadingMessage("Unexpected error occured...");
            this.layers.notyf.error({ message: "Can't start emulator look browser logs for more info"});
            console.error(e);
            throw e;
        }

        const emulatorsUi = this.emulatorsUi;
        if (this.emulatorFunction === "janus") {
            emulatorsUi.graphics.video(this.layers, ci);
        } else {
            emulatorsUi.persist.save(persistKey, this.layers, ci, emulators);
            try {
                if (this.options.noWebGL === true) {
                    throw new Error("WebGL is disabled by options");
                }
                emulatorsUi.graphics.webGl(this.layers, ci);
            } catch (e) {
                console.error("Unable to create webgl canvas, fallback to 2d rendering");
                emulatorsUi.graphics._2d(this.layers, ci);
            }
            emulatorsUi.sound.audioNode(ci);
        }

        this.layers.setLoadingMessage("Waiting for config...");
        const config = await ci.config();
        this.setLayersConfig(extractLayersConfig(config))

        this.layers.setLoadingMessage("Ready");
        this.layers.hideLoadingLayer();

        if (this.clickToStart) {
            this.layers.showClickToStart();
        }

        return ci;
    }

    async stop(): Promise<void> {
        this.layers.showLoadingLayer();

        if (this.ciPromise === undefined) {
            return;
        }

        const ci = await this.ciPromise;
        delete this.ciPromise;
        await ci.exit();

        return;
    }

    public async setLayersConfig(config: LayersConfig | LegacyLayersConfig | null, layerName?: string) {
        if (this.ciPromise === undefined) {
            return;
        }

        const ci = await this.ciPromise;

        this.layersConfig = config;
        this.unbindControls();

        if (config === null) {
            this.unbindControls = initNullLayersControl(this.layers, ci);
        } else if (config.version === undefined) {
            this.unbindControls = initLegacyLayersControl(this.layers, config as LegacyLayersConfig, ci);
        } else {
            this.unbindControls = initLayersControl(this.layers, config as LayersConfig, ci, this, layerName);
        }
    }

    public getLayersConfig(): LayersConfig | LegacyLayersConfig | null {
        return this.layersConfig;
    }

    public enableMobileControls() {
        this.setLayersConfig(this.storedLayersConfig);
        this.storedLayersConfig = null;
    }

    public disableMobileControls() {
        this.storedLayersConfig = this.layersConfig;
        this.setLayersConfig(null);
    }

    private async runBundle(bundleUrl: string, optionalChangesUrl: string | undefined, persistKey: string) {
        const emulatorsUi = this.emulatorsUi;
        if (this.emulatorFunction === "janus") {
            this.layers.setLoadingMessage("Connecting...");
            this.ciPromise = emulators.janus(bundleUrl);
        } else {
            this.layers.setLoadingMessage("Downloading bundle ...");
            const bundlePromise = emulatorsUi.network.resolveBundle(bundleUrl, {
                onprogress: (percent) => this.layers.setLoadingMessage("Downloading bundle " + percent + "%"),
            });
            try {
                let changesBundle: Uint8Array | undefined;
                if (optionalChangesUrl !== undefined && optionalChangesUrl !== null && optionalChangesUrl.length > 0) {
                    changesBundle = await emulatorsUi.network.resolveBundle(optionalChangesUrl + "?dt=" + Date.now(), {
                        httpCache: false,
                    });
                } else {
                    changesBundle = await emulatorsUi.persist.load(persistKey, emulators);
                }
                const bundle = await bundlePromise;
                if (this.emulatorFunction === "backend") {
                    this.ciPromise = emulators.backend([bundle, changesBundle], (this as any).createTransportLayer() as TransportLayer);
                } else {
                    this.ciPromise = emulators[this.emulatorFunction]([bundle, changesBundle]);
                }
            } catch {
                const bundle = await bundlePromise;
                if (this.emulatorFunction === "backend") {
                    this.ciPromise = emulators.backend([bundle], (this as any).createTransportLayer() as TransportLayer);
                } else {
                    this.ciPromise = emulators[this.emulatorFunction]([bundle]);
                }
            }
        }

        return this.ciPromise;
    }
}

export type DosFactoryType = (root: HTMLDivElement, options?: DosOptions) => DosInstance;
