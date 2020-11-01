import {Line} from "../../types/formatter-types";


export interface AwsLambdaLine extends Line {
    logStreamName?: string;
}

export interface GeoSpetialLine extends AwsLambdaLine {
    group?: string;
    companyId?: string;
    correlationId?: string;
    stage?: string;
    service?: string;
    label?: string;
    user?: GeoSpetialUser;
    serviceName?: string;
    functionName?: string;
}

export interface GeoSpetialUser {
    id: string;
    accountId: string;
    email: string
}
