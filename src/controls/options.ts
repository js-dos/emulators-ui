import { CommandInterface } from "emulators";
import { Layers } from "../dom/layers";
import { createButton, ButtonSize } from "./button";
import { pointer } from "./pointer";

import Keyboard from "simple-keyboard";
import { domToKeyCode, KBD_enter, KBD_leftshift, KBD_backspace, KBD_capslock, KBD_tab, KBD_space, KBD_esc, KBD_leftctrl, KBD_leftalt } from "../dom/keys";

export function options(layers: Layers,
                        layersNames: string[],
                        onLayerChange: (layer: string) => void) {
    const size = Math.round(ButtonSize);
    const ident = Math.round(size / 4);

    let controlsVisbile = false;
    let keyboardVisible = false;

    const keyboardDiv = createDiv("emulator-keyboard");
    keyboardDiv.style.display = "none";
    stopPropagation(keyboardDiv);

    new Keyboard(keyboardDiv, {
        layout: layout,
        onKeyPress: button => {
            const keyCode = buttonToCode(button);
            if (keyCode !== 0) {
                layers.fireKeyPress(keyCode);
            }
        },
        preventMouseDownDefault: true,
        preventMouseUpDefault: true,
        stopMouseDownPropagation: true,
        stopMouseUpPropagation: true,
        autoUseTouchEvents: true,
        useMouseEvents: true,
    });

    const toggleKeyboard = () => {
        keyboardVisible = !keyboardVisible;
        const display = keyboardVisible ? "block" : "none";
        keyboardDiv.style.display = display;

        if (keyboardVisible) {
            keyboard.classList.add("emulator-control-close-icon");
        } else  {
            keyboard.classList.remove("emulator-control-close-icon");
        }

        return keyboardVisible;
    };

    const updateVisibility = () => {
        const display = controlsVisbile ? "flex" : "none";
        for (const next of children) {
            if (next == options) {
                continue;
            }

            next.style.display = display;
        }
    };

    const toggleOptions = () => {
        controlsVisbile = !controlsVisbile;

        if (!controlsVisbile && keyboardVisible) {
            toggleKeyboard();
        }

        updateVisibility();
    };

    const children: HTMLElement[] = [
        createSelectForLayers(layersNames, onLayerChange),
        createButton("keyboard", {
            onClick: () => {
                toggleKeyboard();

                if (controlsVisbile && !keyboardVisible) {
                    controlsVisbile = false;
                    updateVisibility();
                }
            },
        }),
        createButton("save", {
            onClick: () => {
                layers.save();

                if (controlsVisbile) {
                    toggleOptions();
                }
            }
        }),
        createButton("fullscreen", {
            onClick: () => {
                layers.toggleFullscreen();

                if (controlsVisbile) {
                    toggleOptions();
                }
            },
        }),
        createButton("options", {
            onClick: toggleOptions,
        })
    ];
    const options = children[children.length - 1];
    const fullscreen = children[children.length - 2].children[0];
    const keyboard = children[children.length - 4].children[0];

    layers.setOnFullscreen((fullscreenEnabled) => {
        if (fullscreenEnabled) {
            if (!fullscreen.classList.contains("emulator-control-exit-fullscreen-icon")) {
                fullscreen.classList.add("emulator-control-exit-fullscreen-icon");
            }
        } else {
            fullscreen.classList.remove("emulator-control-exit-fullscreen-icon");
        }
    });

    const container = createDiv("emulator-options");
    for (const next of children) {
        if (next !== options) {
            next.classList.add("emulator-button-control");
        }
        next.style.marginRight = ident + "px";
        next.style.marginBottom = ident + "px";
        if (next !== options) {
            next.style.display = "none";
        }
        container.appendChild(next);
    }

    container.style.position = "absolute";
    container.style.right = "0";
    container.style.top = ident + "px";

    layers.mouseOverlay.appendChild(container);
    layers.mouseOverlay.appendChild(keyboardDiv);
    layers.toggleKeyboard = toggleKeyboard;

    return () => {
        layers.toggleKeyboard = () => false;
        layers.mouseOverlay.removeChild(container);
        layers.mouseOverlay.removeChild(keyboardDiv);
        layers.setOnFullscreen(() => {/**/});
    };
}

function createSelectForLayers(layers: string[], onChange: (layer: string) => void) {
    if (layers.length <= 1) {
        return document.createElement("div");
    }

    const select = document.createElement("select");
    select.classList.add("emulator-control-select");


    for (const next of layers) {
        const option = document.createElement("option");
        option.value = next;
        option.innerHTML = next;
        select.appendChild(option);
    }

    select.onchange = (e: any) => {
        const layer = e.target.value;
        onChange(layer);
    };

    stopPropagation(select, false);

    return select;
}

function stopPropagation(el: HTMLElement, preventDefault: boolean = true) {
    const onStop = (e: Event) => {
        e.stopPropagation();
    };
    const onPrevent = (e: Event) => {
        e.stopPropagation();
        if (preventDefault) {
            e.preventDefault();
        }
    };
    const options = {
        capture: false,
    };
    for (const next of pointer.starters) {
        el.addEventListener(next, onStop, options);
    }
    for (const next of pointer.enders) {
        el.addEventListener(next, onStop, options);
    }
    for (const next of pointer.prevents) {
        el.addEventListener(next, onPrevent, options);
    }
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

function createDiv(className: string, innerHtml?: string) {
    const el = document.createElement("div");
    el.className = className;
    if (innerHtml !== undefined) {
        el.innerHTML = innerHtml;
    }
    return el;
}

const layout = {
    default: [
        '{esc} ` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
        'q w e r t y u i o p [ ] \\',
        'a s d f g h j k l ; \' {enter}',
        'z x c v b n m , . / {space}',
    ],
};
