/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logtail } from "@logtail/node";

const sourceToken = process.env.BETTERSTACK_SOURCE_TOKEN;
const betterstackEndpoint = "https://s1567999.eu-nbg-2.betterstackdata.com";

let loggerInstance:Logtail;

if(sourceToken) {
    loggerInstance = new Logtail(sourceToken, {
        endpoint: betterstackEndpoint
    });
    console.log("Better Stack Logger initialized.");
} else {
    console.warn("BETTERSTACK_SOURCE_TOKEN not found. Logging to console instead.");
    loggerInstance = {
        info: console.info,
        warn: console.warn,
        error: console.error,
        flush: async () => { /* No-op im Konsolen-Fallback */ },
    } as any;
}

export const logger = loggerInstance;