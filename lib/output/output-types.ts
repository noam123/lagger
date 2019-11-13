import {Formatter} from "../formatters/formatter-types";

export type OutputChannelType = "file" | "console";

export interface OutputChannel {
    output(formatter: Formatter): void;
}

export interface ConsoleOptions {
    performanceMsThreshold: number;
}
