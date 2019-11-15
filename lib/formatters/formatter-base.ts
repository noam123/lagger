import {Formatter, FormatterOptions, FormatterOutput} from "./formatter-types";
import {FormatterUtils} from "../utils/formatter-utils";


export abstract class FormatterBase implements Formatter{
    protected tags: string;

    constructor(protected options?: FormatterOptions) {
       this.tags = FormatterUtils.getFormattedTags(options?.tags);
    }

    abstract formatLine(line: string): FormatterOutput;
}
