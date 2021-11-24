// eslint-disable-next-line

import * as process from "process";

export function log(first?: any, ...args: any[]) {
    console.log.apply(null, ["[INFO]", first, ...args]);
}

export function warn(first?: any, ...args: any[]) {
    console.log.apply(null, ["[WARN]", first, ...args]);
}

export function error(first?: any, ...args: any[]) {
    console.log.apply(null, ["[ERROR]", first, ...args]);
}

export function fatal(first?: any, ...args: any[]) {
    console.log.apply(null, ["[FATAL]", first, ...args]);
    process.exit(1);
}
