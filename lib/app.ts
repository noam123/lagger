import {OutputChannel, OutputChannelType} from "./output/output-types";
import {Formatter, FormatterOptions} from "./formatters/formatter-types";
import {FormatterFactory} from "./formatters/formatter-factory";
import {FileOutputChannel} from "./output/file-output-channel";
import {ConsoleOutputChannel} from "./output/console-output-channel";
import {HelpUtils} from "./utils/help-utils";
import {ConfigurationUtils} from "./utils/configuration-utils";
import _ = require("lodash");
const packageJson = require('../package.json');

process.on("uncaughtException", err => {
    console.log(err);
    process.exit(1);
});


let performanceMsThreshold:number;
let format: string;
let outputChannel: OutputChannel;
let formatterOptions: FormatterOptions = {
    tags: [],
    silentFormatterErrors: false
};

const args = process.argv.slice(2);
if (args && args.length > 0) {
    args.forEach(function(arg){
        let argArr = arg.split('=');
        let flag = argArr[0];
        let value = argArr[1];

        switch (flag) {
            case '-o':
            case '--output':
                outputChannel = new FileOutputChannel(value);
                break;
            case '-p':
            case '--performance-threshold':
                if (!value){
                    console.error("Missing performance millisecond gap threshold value.\nRun with -h for more information.");
                    process.exit(1);
                }
                performanceMsThreshold = parseInt(value);
                break;
            case '--format':
                format = value;
                if (!format){
                    console.error("Missing formatter type.\nRun with -h for more information.");
                    process.exit(1);
                }
                break;
            case '-t':
                formatterOptions.tags.push(value);
                break;
            case '-s':
                formatterOptions.silentFormatterErrors = true;
                break;
            case '-h':
                console.log(HelpUtils.getHelpString());
                process.exit(0);
            case '-v':
                console.log(packageJson.version);
                process.exit(0);
            default:
                throw new Error("unsupported flag: " + flag);
        }
    });
}

const environmentVariablesFormatterOptions = ConfigurationUtils.initEnvironmentVariablesConf();
formatterOptions = _.assign(formatterOptions, environmentVariablesFormatterOptions);

if (!outputChannel) {
    outputChannel = new ConsoleOutputChannel({performanceMsThreshold});
}

const formatter: Formatter = FormatterFactory.create(format, formatterOptions);
outputChannel.output(formatter);
