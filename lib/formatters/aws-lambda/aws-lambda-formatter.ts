import {FormatterBase} from "../formatter-base";
import {FormatterOutput, LAGGER_INFO_MESSAGE_TAG} from "../../types/formatter-types";
import {AwsLambdaLine, AdbLine} from "./aws-lambda-formatter-types";


const NOT_AVAILABLE_TAG = "[n/a]";

export class AwsLambdaFormatter extends FormatterBase {

    private _nextToken: string;

    public formatLine(line: string): FormatterOutput {
        try {
            const lineObj: AdbLine | string | undefined = this.parseEventLine(line);
            if (!lineObj) {
                return {formattedLine: ""};
            }

            if (typeof  lineObj === 'string') {
                return {formattedLine: line};
            }

            const {timestamp, message, logStreamName, log_level, level, origin_service_name, origin_service_region, origin_func_name, context_info = {}} = lineObj as AdbLine;
            lineObj.level = lineObj.level || log_level;
            const {correlation_id, tenant_id, session_id, username} = context_info;
            const normalizedExecutionLine = origin_func_name && this._normalizeExecutionLine(origin_func_name)

            const formattedLine = `${timestamp} ` +
                `${this.tags}` +
                `${this.options.verbose && logStreamName ? `[${logStreamName}]` : ''}` +
                `${origin_service_name ? `[${origin_service_name}]` : ''}` +
                `${session_id ? `[sId:${session_id}]` : ''}` +
                `${this.options.verbose && correlation_id ? `[cId:${correlation_id}]` : ''}` +
                `${tenant_id ? `[tId:${tenant_id}]` : ''}` +
                `${username ? `[${username}]` : ''}` +
                `${normalizedExecutionLine ? `[${normalizedExecutionLine}]` : ''}` +
                ` ${lineObj.level}: ${message}`;
            return {formattedLine, lineObj};
        } catch (e) {
            if (!this.silentFormatterErrors) {
                console.error(e);
            }

            return {formattedLine: `${this.tags}${line}`};
        }
    }

    public finalize(): any {}

    private parseEventLine(event:string): AdbLine | string | undefined {
        const parsedLine: string[] = event.split('\t');

        switch (parsedLine.length) {
            case 1: return parsedLine.shift();
            case 2:
                return;
            case 3:
                return
            // return this._getGeoSpetialLogLine(parsedLine);
            case 4:
            case 6:
            case 7:
            case 8:
            case 9:
                return this._getAwsLambdaReportLine(parsedLine);
            case 5:
            case 10:
            case 11:
                return this.getAwsFilterEventsLine(parsedLine);
            default:
                throw new Error(`[PARSE_AWS_EVENT_LINE_ERR]: cannot parse line array of size ${parsedLine.length}`);
        }
    }

    private _getGeoSpetialLogLine(parsedLine: string[]): AdbLine {
        const [events, epochTimestamp, message] = parsedLine;
        if(events !== "EVENTS") {
            return { message: events,  level: 'no-level', timestamp: 'no-timestamp' }
        }

        const timestamp = this._epochToDate(parseInt(epochTimestamp));
        let awsLambdaLine: AwsLambdaLine;
        try {
            awsLambdaLine = JSON.parse(message);
            return { ...awsLambdaLine, timestamp} ;
        } catch (err) {
            return {timestamp , message, level: 'no-level'};
        }
    }

    private _getAwsLambdaReportLine(parsedLine: string[]): AwsLambdaLine {
        const [events, eventId, epochTimestamp, logStreamName, timestamp, requestId, level, log_level, serviceName, functionName, correlationId, stage, user,...message] = parsedLine;
        if(events !== "EVENTS") {
            return { message: events, timestamp: NOT_AVAILABLE_TAG, level: NOT_AVAILABLE_TAG }
        }
        const normalizedTimestamp = this._epochToDate(parseInt(epochTimestamp));
        //if (parsedLine.length === 9) {
        return {timestamp: normalizedTimestamp, level: level?.toLowerCase() || log_level?.toLowerCase(), logStreamName ,message: `${requestId} ${message.join(' ')}`}
        //}

        // return {timestamp: normalizedTimestamp, level: level.toLowerCase(), logStreamName, message: message.join(' ')}
    }

    private _epochToDate(epoch: number): string {
        const normalizedDate: Date = new Date(epoch);
        if (this.options?.localTime) {
            return normalizedDate.toLocaleString('sv', {year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'numeric', second:'numeric', fractionalSecondDigits: 3}).replace(',', '.').replace(' ', 'T');
        }
        return  normalizedDate.toISOString();
    }

    private getAwsFilterEventsLine(parsedLine: string[]): AdbLine {
        const [events, eventId, epochTimestamp, logStreamName, ...message] = parsedLine;
        if(events !== "EVENTS") {
            return { message: events, timestamp: NOT_AVAILABLE_TAG, level: NOT_AVAILABLE_TAG }
        }

        const normalizedTimestamp = this._epochToDate(parseInt(epochTimestamp));
        const normalizedMessage = message.join(" ");
        try {
            const awsLambdaLine = JSON.parse(normalizedMessage);
            return { ...awsLambdaLine, timestamp: normalizedTimestamp, logStreamName} ;
        } catch (err) {
            return {timestamp: normalizedTimestamp, logStreamName, message: normalizedMessage, level: 'lambda-report'};
        }
    }

    private _normalizeExecutionLine(executionLine: string): string {
        const executionLineArr = executionLine.split(" ");
        return `${executionLineArr[0]}.${executionLineArr[3].slice(0,-1)}:${executionLineArr[2].slice(0,-1)}`;
    }
}
