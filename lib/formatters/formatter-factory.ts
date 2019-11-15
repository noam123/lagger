import {Formatter, FormatterOptions} from "./formatter-types";
import {CfFormatter} from "./cf/cf-formatter";
import {SrfFormatter} from "./srf/srf-formatter";


export class FormatterFactory {
    public static create(type: string, formatterOptions: FormatterOptions): Formatter {
        switch (type) {
            case "srf": return new SrfFormatter(formatterOptions);
            case "cf":
            default: return new CfFormatter(formatterOptions);
        }
    }
}
