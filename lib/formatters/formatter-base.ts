import {Formatter, FormatterOptions, FormatterOutput} from "./formatter-types";
import {FormatterUtils} from "../utils/formatter-utils";


export abstract class FormatterBase implements Formatter{
    protected tags: string;
    protected silentFormatterErrors: boolean;

    constructor(protected options?: FormatterOptions) {
       this.tags = FormatterUtils.getFormattedTags(options?.tags);
       this.silentFormatterErrors = options?.silentFormatterErrors;
    }

    abstract formatLine(line: string): FormatterOutput;
}
