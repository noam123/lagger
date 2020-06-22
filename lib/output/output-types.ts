import {Formatter} from "../types/formatter-types";

export type OutputChannelType = "file" | "console";

export interface OutputChannel {
    output(formatter: Formatter): void;
}

export interface ConsoleOptions {
    performanceMsThreshold: number;
}
