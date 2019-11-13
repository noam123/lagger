import {Formatter} from "./formatter-types";
import {CfFormatter} from "./cf/cf-formatter";
import {SrfFormatter} from "./srf/srf-formatter";


export class FormatterFactory {
    public static create(type: string): Formatter {
        switch (type) {
            case "srf": return new SrfFormatter();
            case "cf":
            default: return new CfFormatter();
        }
    }
}
