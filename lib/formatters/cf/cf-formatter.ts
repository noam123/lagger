import {Formatter, FormatterOutput} from "../../types/formatter-types";
import {CfJsonMessage, CfLine, CloudJsonMessage} from "./types";
import {FormatterBase} from "../formatter-base";


export class CfFormatter extends FormatterBase {

    public formatLine(line: string): FormatterOutput {
        try {
            const lineObj = this.parseJsonedLine(line);
            const {timestamp, accountName, namespace, userName, level, message, correlationId, service, workflowId} = lineObj;
            const formattedLine = `${timestamp} [${namespace}]` +
                `${this.tags}` +
                `${accountName ? `[a:${accountName}]` : ""}` +
                `${userName ? `[u:${userName}]` : ''}` +
                `${correlationId ? `[cId:${correlationId}]` : ''}` +
                `${workflowId ? `[wId:${workflowId}]` : ''}` +
                `[${level}]: ${message}`;
            return {formattedLine, lineObj};
        } catch (e) {
            if (!this.silentFormatterErrors) {
                console.error(e);
            }

            return {formattedLine: `${this.tags}${line}`};
        }
    }

    private parseJsonedLine(jsonedLine:string): CfLine {
        let line: CfJsonMessage & CloudJsonMessage;
        try {
            line = JSON.parse(jsonedLine);
        } catch (e) {
            throw new Error(`JSON_PARSE_ERROR: failed to parse line on ${e}, line ${jsonedLine}`);
        }

        let {metadata, data, hostname, level: cloudLevel, msg, name, pid, time} = line;

        const message = data?.message || msg;
        const level = metadata?.level || cloudLevel || "";
        const timestamp = metadata?.time || time;
        const userName = metadata?.authenticatedEntity?.name;
        const accountName =  metadata?.authenticatedEntity?.activeAccount?.name || metadata?.authenticatedEntity?.account?.name;
        const namespace = metadata?.namespace || "no-namespace";
        const correlationId = metadata?.correlationId;
        const service = metadata?.service;
        const workflowId = metadata?.authenticatedEntity?.workflowId;

        if (!timestamp || !message) {
            throw new Error(`INVALID_INPUT_ERROR: missing critical fields, timestamp ${timestamp} | message ${message}, line ${JSON.stringify(line)}`);
        }

        return {
            correlationId,
            service,
            workflowId,
            message,
            level,
            timestamp,
            userName,
            accountName,
            namespace
        };
    }

}
