import {Formatter, FormatterOutput} from "../formatter-types";
import {CfJsonMessage, CfLine} from "./types";


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
        let line: CfJsonMessage;
        try {
            line = JSON.parse(jsonedLine);
        } catch (e) {
            throw new Error(`invalid line input: ${e}`);
        }

        let {metadata, data} = line;

        const message = data?.message;
        const level = metadata?.level || "";
        const timestamp = metadata?.time;
        const userName = metadata?.authenticatedEntity?.name;
        const accountName =  metadata?.authenticatedEntity?.activeAccount?.name || metadata?.authenticatedEntity?.account?.name;
        const namespace = metadata?.namespace || "no-namespace";
        const correlationId = metadata?.correlationId;
        const service = metadata?.service;
        const workflowId = metadata?.authenticatedEntity?.workflowId;

        if (!timestamp || !message) {
            throw new Error("invalid input");
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
