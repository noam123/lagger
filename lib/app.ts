import {OutputChannel, OutputChannelType} from "./output/output-types";
import {Formatter} from "./formatters/formatter-types";
import {FormatterFactory} from "./formatters/formatter-factory";
import {FileOutputChannel} from "./output/file-output-channel";
import {ConsoleOutputChannel} from "./output/console-output-channel";
import {HelpUtil} from "./utils/help-util";

const packageJson = require('../package.json');

process.on("uncaughtException", err => {
    console.log(err);
    process.exit(1);
});

let performanceMsThreshold:number;
let format: string;
let outputChannel: OutputChannel;

const args = process.argv.slice(2);
if (args && args.length > 0) {
    args.forEach(function(arg){
        let argArr = arg.split('=');
        let flag = argArr[0];
        let value = argArr[1];

        switch (flag) {
            case '-f':
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
            case '-h':
                console.log(HelpUtil.getHelpString());
                process.exit(0);
            case '-v':
                console.log(packageJson.version);
                process.exit(0);
            default:
                throw "unsupported flag: " + flag;
        }
    });
}

if (!outputChannel) {
    outputChannel = new ConsoleOutputChannel({performanceMsThreshold});
}

const formatter: Formatter = FormatterFactory.create(format);
outputChannel.output(formatter);

function helpString() {
    return `
    Lagger (${packageJson.version})
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Command execution:
    lagger [OPTIONS]
    
    OPTIONS:
    [-f]    
            Path to the file which needs to be formatted.
            i.e. lagger -f=/tmp/file.log 
    
    [--format]
            Formatter type (defualt: cf)
        
    [--performance-threshold, -p]    
            Performance millisecond gap threshold, if and only if threshold has been hit, log lines will be printted with the time it took (in ms) 
            i.e. lagger -performance-threshold=50000
            
    [-v]    
            Show lagger version.
            i.e. lagger -v
    `
}