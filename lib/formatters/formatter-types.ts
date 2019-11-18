

export interface Formatter {
    formatLine(line: string): FormatterOutput;
}

export interface FormatterOutput {
     formattedLine: string;
     lineObj?: any;
}

export interface FormatterOptions {
    tags?: string[];
    silentFormatterErrors?: boolean;
}

export interface Line {
    message: string;
    level: string;
    timestamp: string;
}
