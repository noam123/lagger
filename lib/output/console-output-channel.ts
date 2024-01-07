import {Formatter} from "../types/formatter-types";
import * as readline from "readline";
import {ConsoleOptions, OutputChannel} from "./output-types";
// NOTE: do not upgrade chalk to 5.x.x it's using dynamic imports (esm) and will mess typings
import * as chalk from "chalk";

export class ConsoleOutputChannel implements OutputChannel {

    private performanceMsThreshold: number;

    constructor(options?: ConsoleOptions){
        this.performanceMsThreshold = options?.performanceMsThreshold;
    }

    public output(formatter: Formatter): void {

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.on('line',(line) => {
            this.printFormattedLine(line, formatter);
        });

    }

    private printFormattedLine(line: string, formatter: Formatter): void {
        let previousTimestamp = 0;
        try {
            let {formattedLine, lineObj}  = formatter.formatLine(line);
            if (!formattedLine) {
                return;
            }

            if (this.performanceMsThreshold) {
                const currentTimestamp = new Date(lineObj.timestamp).getTime();
                const timeDelta = currentTimestamp - previousTimestamp;
                if (timeDelta > this.performanceMsThreshold) {
                    formattedLine = `${chalk.bold.yellow(`Performance Threshold Hit [${this.performanceMsThreshold} ms]: ${timeDelta} ms\t\tSTART ${new Date(previousTimestamp).toISOString()} END ${new Date(currentTimestamp).toISOString()}`)}\n\r${formattedLine}`
                }
                previousTimestamp = currentTimestamp;
            }

            switch (lineObj?.level?.toLowerCase()) {
                case "error":
                    const error = chalk.bold.red;
                    return console.log(error(formattedLine));
                case "warning":
                case "warn": return console.log(chalk.yellow(formattedLine));
                case "debug": return console.log(chalk.gray(formattedLine));
                case "performance":
                default: return console.log(chalk.white(formattedLine));
            }

        } catch (e) {
            return console.log(line);
        }
    }

}
