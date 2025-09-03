import {Formatter, FormatterOutput} from "../../types/formatter-types";
import {FormatterBase} from "../formatter-base";

interface SrfJsonMessage {

}

export class Peer5Formatter extends FormatterBase{

    public formatLine(line: string): FormatterOutput {
        try {
            // const [timestamp, ...rest] = line.split(" ");
            // const lineObj = this.parseJsonedLine(rest.join(" "));
            const lineObj = this.parseJsonedLine(line);
            if (lineObj.errorCode) {
                const formattedErrorLine: string = `${lineObj.timestamp} [${lineObj.errorName}] [${lineObj.errorCode}] error: ${lineObj.message} ${lineObj.stack}`;
                return {lineObj, formattedLine: formattedErrorLine};
            }
            const formattedLine: string = `${lineObj.timestamp} [${lineObj.module}] ${lineObj.level}: ${lineObj.message}`;
            return {lineObj, formattedLine};
        } catch (e) {
            return {formattedLine: line};
        }
    }

    private parseJsonedLine(jsonedLine: string) {
        const [timestampStr, ...jsonedArr] = jsonedLine.split(" ");

        let line;
        try {
            line = JSON.parse(jsonedArr.join(" "));
        } catch (e) {
            throw new Error(`invalid line input: ${e}`);
        }

        let {timestamp = timestampStr, message, module, level, stack, errors: errorMessage, code: errorCode, name: errorName} = line;

        line.timestamp = timestamp;
        line.message = (message && message.replace(/\r?\n|\r/gm, '')) || errorMessage; // trim new lines
        line.module = module || "n/a";
        line.level = level || "";
        line.stack = stack || "";
        line.errorCode = errorCode || "";
        line.errorName = errorName || "";

        if (!timestamp || !line.message) {
            throw new Error("invalid input");
        }

        return line;
    }

}
