import {FormatterBase} from "../formatter-base";
import {FormatterOutput, LAGGER_INFO_MESSAGE_TAG} from "../../types/formatter-types";
import {AwsLambdaLine, GeoSpetialLine} from "./aws-lambda-formatter-types";
import * as childProcess from 'child_process'
import * as util from 'util';


const NOT_AVAILABLE_TAG = "[n/a]";

export class AwsLambdaFormatter extends FormatterBase {

    private _nextToken: string;

    public formatLine(line: string): FormatterOutput {
        try {
            const lineObj: AwsLambdaLine | string | undefined = this.parseEventLine(line);
            if (!lineObj) {
                return {formattedLine: ""};
            }

            if (typeof  lineObj === 'string') {
                return {formattedLine: line};
            }

            const {timestamp, level, message, group, companyId, correlationId, service, stage, userId, logStreamName} = lineObj as GeoSpetialLine;
            const formattedLine = `${timestamp} ` +
                `${this.tags}` +
                `${correlationId ? `[cId:${correlationId}]` : ''}` +
                `${logStreamName ? `[${logStreamName}]` : ''}` +
                `${userId ? `[uId:${userId}]` : ''}` +
                `${companyId ? `[compId:${companyId}]` : ''}` +
                `${group ? `[${group}]` : ''}` +
                `${service ? `[${service}]` : ''}` +
                `[${level}]: ${message}`;
            return {formattedLine, lineObj};
        } catch (e) {
            if (!this.silentFormatterErrors) {
                console.error(e);
            }

            return {formattedLine: `${this.tags}${line}`};
        }
    }

    public finalize(): any {}

    private parseEventLine(event:string): GeoSpetialLine | string | undefined {
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

    private _getGeoSpetialLogLine(parsedLine: string[]): GeoSpetialLine {
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
        const [events, eventId, epochTimestamp, logStreamName, timestamp, requestId, level, ...message] = parsedLine;
        if(events !== "EVENTS") {
            return { message: events, timestamp: NOT_AVAILABLE_TAG, level: NOT_AVAILABLE_TAG }
        }
        const normalizedTimestamp = this._epochToDate(parseInt(epochTimestamp));
        //if (parsedLine.length === 9) {
            return {timestamp: normalizedTimestamp, level: level.toLowerCase(), logStreamName ,message: `${requestId} ${message.join(' ')}`}
        //}

        // return {timestamp: normalizedTimestamp, level: level.toLowerCase(), logStreamName, message: message.join(' ')}
    }

    private _epochToDate(epoch: number): string {
        const normalizedDate: Date = new Date(epoch);
        return  normalizedDate.toISOString();
    }

    private getAwsFilterEventsLine(parsedLine: string[]): GeoSpetialLine {
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
}
