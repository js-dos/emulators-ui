import { Notyf } from "notyf";
import Keyboard from "simple-keyboard";
import { createDiv, stopPropagation } from "./helpers";

import { domToKeyCode, KBD_enter, KBD_leftshift, KBD_backspace, KBD_capslock, KBD_tab, KBD_space, KBD_esc, KBD_leftctrl, KBD_leftalt } from "./keys";

// tslint:disable-next-line:no-var-requires
const elementResizeDetector = require("element-resize-detector");
const resizeDetector = elementResizeDetector({
});

export interface LayersOptions {
}

export function layers(root: HTMLDivElement, options?: LayersOptions) {
    return new Layers(root, options || {});
}

export class Layers {
    root: HTMLDivElement;
    loading: HTMLDivElement;
    canvas: HTMLCanvasElement;
    video: HTMLVideoElement;
    mouseOverlay: HTMLDivElement;
    width: number;
    height: number;
    fullscreen: boolean = false;
    pointerButton: 0 | 1 = 0;

    notyf = new Notyf();
    toggleKeyboard: () => boolean = () => false;

    private clickToStart: HTMLDivElement;
    private loaderText: HTMLPreElement;
    private onResize: ((width: number, height: number) => void)[];

    private onKeyDown: (keyCode: number) => void;
    private onKeyUp: (keyCode: number) => void;
    private onKeyPress: (keyCode: number) => void;

    private onSave: () => Promise<void>;

    private onFullscreenChanged: (fullscreen: boolean) => void = () => {/**/ };
    private onKeyboardChanged: ((visible: boolean) => void)[] = [];

    constructor(root: HTMLDivElement, options: LayersOptions) {
        this.root = root;
        this.root.classList.add("emulator-root");

        this.canvas = document.createElement("canvas");
        this.canvas.className = "emulator-canvas";

        this.video = document.createElement("video");
        this.video.setAttribute("autoplay", "");
        this.video.setAttribute("playsinline", "");
        this.video.className = "emulator-video";

        this.loading = createLoadingLayer();
        this.loaderText = this.loading.querySelector(".emulator-loading-pre-2") as HTMLPreElement;
        this.mouseOverlay = createMouseOverlayLayer();

        this.clickToStart = createClickToStartLayer();
        this.clickToStart.onclick = () => {
            this.clickToStart.style.display = "none";
            this.video.play();
        };

        this.root.appendChild(this.canvas);
        this.root.appendChild(this.video);
        this.root.appendChild(this.mouseOverlay);
        this.root.appendChild(this.clickToStart);
        this.root.appendChild(this.loading);

        this.width = root.offsetWidth;
        this.height = root.offsetHeight;

        this.onResize = [];
        this.onKeyDown = () => { /**/ };
        this.onKeyUp = () => { /**/ };
        this.onKeyPress = () => { /**/ };
        this.onSave = () => { return Promise.reject(new Error("Not implemented")); };

        resizeDetector.listenTo(this.root, (el: HTMLElement) => {
            if (el !== root) {
                return;
            }

            this.width = el.offsetWidth;
            this.height = el.offsetHeight;
            for (const next of this.onResize) {
                next(this.width, this.height);
            }
        });

        this.initKeyEvents();
        this.initKeyboard();
        this.preventContextMenu();


        this.root.onfullscreenchange = () => {
            if (document.fullscreenElement !== this.root) {
                this.fullscreen = false;
                this.onFullscreenChanged(this.fullscreen);
            }
        }
    }

    private initKeyEvents() {
        window.addEventListener("keydown", (e) => {
            const keyCode = domToKeyCode(e.keyCode);
            this.onKeyDown(keyCode);
        });

        window.addEventListener("keyup", (e) => {
            const keyCode = domToKeyCode(e.keyCode);
            this.onKeyUp(keyCode);
        });
    }

    preventContextMenu() {
        this.root.addEventListener("contextmenu", (e) => {
            e.stopPropagation();
            e.preventDefault();
            return false;
        });
    }

    addOnResize(handler: (width: number, height: number) => void) {
        this.onResize.push(handler);
    }

    removeOnResize(handler: (width: number, height: number) => void) {
        this.onResize = this.onResize.filter((n) => n !== handler);
    }

    setOnKeyDown(handler: (keyCode: number) => void) {
        this.onKeyDown = handler;
    }

    fireKeyDown(keyCode: number) {
        this.onKeyDown(keyCode);
    }

    setOnKeyUp(handler: (keyCode: number) => void) {
        this.onKeyUp = handler;
    }

    fireKeyUp(keyCode: number) {
        this.onKeyUp(keyCode);
    }

    setOnKeyPress(handler: (keyCode: number) => void) {
        this.onKeyPress = handler;
    }

    fireKeyPress(keyCode: number) {
        this.onKeyPress(keyCode);
    }

    toggleFullscreen() {
        if (this.fullscreen) {
            this.fullscreen = false;
            if (this.root.classList.contains("emulator-fullscreen-workaround")) {
                this.root.classList.remove("emulator-fullscreen-workaround");
            } else if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }
            this.onFullscreenChanged(false);
        } else {
            this.fullscreen = true;
            const element = this.root as any;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            } else if (element.webkitEnterFullscreen) {
                element.webkitEnterFullscreen();
            } else {
                this.root.classList.add("emulator-fullscreen-workaround");
            }
            this.onFullscreenChanged(true);
        }
    }

    setOnFullscreen(onFullscreenChanged: (fullscreen: boolean) => void) {
        this.onFullscreenChanged = onFullscreenChanged;
    }

    setOnKeyboardVisibility(onKeyboardChanged: (visible: boolean) => void) {
        this.onKeyboardChanged.push(onKeyboardChanged);
    }

    removeOnKeyboardVisibility(onKeyboardChanged: (visible: boolean) => void) {
        this.onKeyboardChanged = this.onKeyboardChanged.filter((n) => n !== onKeyboardChanged);
    }

    save(): Promise<void> {
        return this.onSave()
            .then(() => {
                this.notyf.success("Saved");
            })
            .catch((error) => {
                this.notyf.error(error.message);
            });
    }

    setOnSave(handler: () => Promise<void>) {
        this.onSave = handler;
    }

    hideLoadingLayer() {
        this.loading.style.visibility = "hidden";
    }

    showLoadingLayer() {
        this.loading.style.visibility = "visible";
    }

    setLoadingMessage(message: string) {
        this.loaderText.innerHTML = message;
    }

    switchToVideo() {
        this.video.style.display = "block";
        this.canvas.style.display = "none";
    }

    showClickToStart() {
        this.clickToStart.style.display = "flex";
    }

    private initKeyboard() {
        let keyboardVisible = false;

        const layout = {
            default: [
                '{esc} ` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
                'q w e r t y u i o p [ ] \\',
                'a s d f g h j k l ; \' {enter}',
                'z x c v b n m , . / {space}',
            ],
        };

        const keyboardDiv = createDiv("emulator-keyboard");
        keyboardDiv.style.display = "none";
        stopPropagation(keyboardDiv);

        new Keyboard(keyboardDiv, {
            layout,
            onKeyPress: button => {
                const keyCode = buttonToCode(button);
                if (keyCode !== 0) {
                    this.fireKeyPress(keyCode);
                }
            },
            preventMouseDownDefault: true,
            preventMouseUpDefault: true,
            stopMouseDownPropagation: true,
            stopMouseUpPropagation: true,
            autoUseTouchEvents: true,
            useMouseEvents: true,
        });


        this.toggleKeyboard = () => {
            keyboardVisible = !keyboardVisible;
            const display = keyboardVisible ? "block" : "none";
            keyboardDiv.style.display = display;

            for (const next of this.onKeyboardChanged) {
                next(keyboardVisible);
            }

            return keyboardVisible;
        };

        this.mouseOverlay.appendChild(keyboardDiv);
    }
}

function createLoadingLayer() {
    return createDiv("emulator-loading", `
<div class='emulator-loading-inner'>
<pre class='emulator-loading-pre-1'>
        _                __
       (_)____      ____/ /___  _____ _________  ____ ___
      / / ___/_____/ __  / __ \\/ ___// ___/ __ \\/ __ \`__ \\
     / (__  )_____/ /_/ / /_/ (__  )/ /__/ /_/ / / / / / /
  __/ /____/      \\__,_/\\____/____(_)___/\\____/_/ /_/ /_/
 /___/
</pre>
<pre class='emulator-loading-pre-2'>
</pre>
<div class='emulator-loader'>
</div>
</div>
`);
}

function createMouseOverlayLayer() {
    return createDiv("emulator-mouse-overlay", "");
}

function createClickToStartLayer() {
    return createDiv("emulator-click-to-start-overlay", `
<div class="emulator-click-to-start-text">Press to start</div>
<div class="emulator-click-to-start-icon"></div>
`);
}

function buttonToCode(button: string) {
    let keyCode = 0;
    if (button.length > 1) {
        if (button === "{enter}") {
            keyCode = KBD_enter;
        } else if (button === "{shift}") {
            keyCode = KBD_leftshift;
        } else if (button === "{bksp}") {
            keyCode = KBD_backspace;
        } else if (button === "{lock}") {
            keyCode = KBD_capslock;
        } else if (button === "{tab}") {
            keyCode = KBD_tab;
        } else if (button === "{space}") {
            keyCode = KBD_space;
        } else if (button === "{esc}") {
            keyCode = KBD_esc;
        } else if (button === "ctrl") {
            keyCode = KBD_leftctrl;
        } else if (button === "{alt}") {
            keyCode = KBD_leftalt;
        } else {
            console.warn("Unknown button", button);
        }
    } else {
        keyCode = domToKeyCode(button.toUpperCase().charCodeAt(0));
    }

    return keyCode;
}
