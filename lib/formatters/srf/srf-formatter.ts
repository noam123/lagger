import {Formatter, FormatterOutput} from "../formatter-types";

interface SrfJsonMessage {

}

export class SrfFormatter implements Formatter {

    public formatLine(line: string): FormatterOutput {
        try {
            const lineObj = this.parseJsonedLine(line);
            const formattedLine: string = `${lineObj.timestamp} [${lineObj.username}] [${lineObj.level}]: ${lineObj.message} ${lineObj.body}`;
            return {lineObj, formattedLine};
        } catch (e) {
            return {formattedLine: line};
        }
    }

    private parseJsonedLine(jsonedLine: string) {
        let line;
        try {
            line = JSON.parse(jsonedLine);
        } catch (e) {
            throw new Error(`invalid line input: ${e}`);
        }

        let {timestamp, message, username, body, level} = line;

        line.message = message && message.replace(/\r?\n|\r/gm, ''); // trim new lines
        line.username = username || "no-context";
        line.body = body || "";
        line.level = level || "";

        if (!timestamp || !message) {
            throw new Error("invalid input");
        }

        return line;
    }

}
