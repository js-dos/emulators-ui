// eslint-disable-next-line
const nipplejs = require("nipplejs");

import { CommandInterface } from "emulators";
import { Layers } from "../../dom/layers";

import { mount } from "./mouse-common";

const repeatInterval = 16;
const repeatThreshold = 300 * 300;
const clickDelay = 500;
const clickThreshold = 50;

export function mouseSwipe(sensitivity: number, layers: Layers, ci: CommandInterface) {
    const el = layers.mouseOverlay;

    let startedAt = -1;
    let intervalId = -1;
    let accX = 0;
    let accY = 0;
    let acc = 0;

    const installRepeat = (mX: number, mY: number) => {
        intervalId = setInterval(() => {
            (ci as any).sendMouseRelativeMotion(mX * sensitivity / 10, mY * sensitivity / 10);
        }, repeatInterval) as any;
    };

    const removeRepeat = () => {
        if (intervalId !== -1) {
            clearInterval(intervalId);
            intervalId = -1;
        }
    };

    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (x: number, y: number) => {
        removeRepeat();

        startedAt = Date.now();
        accX = 0;
        accY = 0;
        acc = 0;
        prevX = x;
        prevY = y;
    };

    function onMouseMove(x: number, y: number, mX: number, mY: number) {
        removeRepeat();

        if (mX === undefined) {
            mX = x - prevX;
        }

        if (mY === undefined) {
            mY = y - prevY;
        }

        prevX = x;
        prevY = y;

        if (mX === 0 && mY === 0) {
            return;
        }

        accX += mX;
        accY += mY;

        acc += Math.abs(mX) + Math.abs(mY);

        (ci as any).sendMouseRelativeMotion(mX * sensitivity * 2, mY * sensitivity * 2);
        if (accX * accX + accY * accY > repeatThreshold) {
            installRepeat(accX, accY);
        }
    }

    const onMouseUp = (x: number, y: number) => {
        removeRepeat();

        const delay = Date.now() - startedAt;

        if (delay < clickDelay && acc < clickThreshold) {
            const button = layers.pointerButton || 0;
            ci.sendMouseButton(button, true);
            setTimeout(() => ci.sendMouseButton(button, false), 60);
        }
    };

    const noop = () => {};

    return mount(el, layers, onMouseDown, onMouseMove, onMouseUp, noop);
}
