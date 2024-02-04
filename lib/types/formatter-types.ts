

export const LAGGER_INFO_MESSAGE_TAG = "[lagger-info]";

export interface Formatter {
    formatLine(line: string): FormatterOutput;
    finalize(): Promise<any>
}

export interface FormatterOutput {
     formattedLine: string;
     lineObj?: any;
}

export interface FormatterOptions {
    tags?: string[];
    silentFormatterErrors?: boolean;
    localTime?: boolean;
    verbose?: boolean;
    necessary?: boolean;
}

export interface Line {
    message: string;
    level: string;
    timestamp: string;
}
