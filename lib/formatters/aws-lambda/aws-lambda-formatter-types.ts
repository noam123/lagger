import {Line} from "../../types/formatter-types";


export interface AwsLambdaLine extends Line {
    logStreamName?: string;
}

export interface GeoSpetialLine extends AwsLambdaLine {
    group?: string;
    userId?: string
    companyId?: string;
    correlationId?: string;
    stage?: string;
    service?: string;
}
