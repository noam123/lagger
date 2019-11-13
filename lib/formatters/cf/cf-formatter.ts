import {Formatter, FormatterOutput} from "../formatter-types";
import {CfJsonMessage, CfLine, CloudJsonMessage} from "./types";


export class CfFormatter implements Formatter {

    public formatLine(line: string): FormatterOutput {
        try {
            const lineObj = this.parseJsonedLine(line);
            const {timestamp, accountName, namespace, userName, level, message, correlationId, service, workflowId} = lineObj;
            const formattedLine = `${timestamp} [${namespace}]` +
                `${accountName ? `[a:${accountName}]` : ""}` +
                `${userName ? `[u:${userName}]` : ''}` +
                `${correlationId ? `[cId:${correlationId}]` : ''}` +
                `${workflowId ? `[wId:${workflowId}]` : ''}` +
                `[${level}]: ${message}`;
            return {formattedLine, lineObj};
        } catch (e) {
            console.error(e);
            return {formattedLine: line};
        }
    }

    private parseJsonedLine(jsonedLine:string): CfLine {
        let line: CfJsonMessage & CloudJsonMessage;
        try {
            line = JSON.parse(jsonedLine);
        } catch (e) {
            throw new Error(`invalid line input: ${e}`);
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
