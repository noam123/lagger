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

export interface AdbLine extends AwsLambdaLine {
    log_level?: string;
    origin_service_name?: string;
    context_info?: AdbContextInfo;
    origin_func_name?: string;
    origin_service_region?: string;
}

export interface AdbContextInfo {
    tenant_id?: string;
    username?:string;
    session_id?: string;
    request_id?: string;
    correlation_id?: string;
    internal_session_id?: string;
    xray_trace_id?: string;
}

export interface GeoSpetialUser {
    id: string;
    accountId: string;
    email: string
}
