import {Line} from "../../types/formatter-types";

export interface CfLine extends Line {
    namespace: string;
    service: string;
    correlationId: string;
    workflowId: string;
    accountName: string;
    userName: string;
}


export interface CfJsonMessage {
    metadata : MetaData;
    data: {
        message: string;
    }
}

export interface MetaData {
    namespace: string;
    service: string;
    time: string;
    correlationId: string;
    level: string;
    authenticatedEntity: AuthenticatedEntity;
}

export interface AuthenticatedEntity {
     type: string;
     account: Account;
     activeAccount: Account;
     workflowId: string;
     name: string;
}

export interface Account {
    name: string;
    _id: string;
}

export interface CloudJsonMessage {
    name: string,
    hostname: string;
    pid: number;
    level: string;
    msg: string;
    time: string;
}
