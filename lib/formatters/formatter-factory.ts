import {Formatter, FormatterOptions} from "../types/formatter-types";
import {CfFormatter} from "./cf/cf-formatter";
import {SrfFormatter} from "./srf/srf-formatter";
import {AwsLambdaFormatter} from "./aws-lambda/aws-lambda-formatter";
import {Peer5Formatter} from "./peer5/peer5-formatter";


export class FormatterFactory {
    public static create(type: string, formatterOptions: FormatterOptions): Formatter {
        switch (type) {
            case "srf": return new SrfFormatter(formatterOptions);
            case "cf": return new CfFormatter(formatterOptions);
            case "aws-lambda":
                return new AwsLambdaFormatter(formatterOptions);
            case "peer5":
            default:
                return new Peer5Formatter(formatterOptions);
        }
    }
}
