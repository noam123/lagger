
const readline = require('readline');
const chalk  = require('chalk');
const fs = require('fs');
const path = require('path');
const packageJson = require('./package.json');

process.on("uncaughtException", err => {
    console.log(err);
});

let performanceMsThreshold, previousTimestamp, previousFormattedLine;

const args = process.argv.slice(2);
if (args && args.length > 0) {
    args.forEach(function(arg){
        let argArr = arg.split('=');
        let flag = argArr[0];
        let value = argArr[1];

        switch (flag) {
            case '-f': return formatFile(value);
            case '-performance-threshold':
                if (!value){
                    console.error("Missing performance millisecond gap threshold value.\nRun with -h for more information.");
                    process.exit(1);
                }
                performanceMsThreshold = value;
                break;
            case '-h':
                console.log(helpString());
                process.exit(0);
            case '-v':
                console.log(packageJson.version);
                process.exit(0);
            default: throw "unsupported flag: " + flag;
        }
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', function (line) {
    printFormattedLine(line);
});


function formatFile(filePath) {
    console.log("formatting file: " + filePath);
    var parsedFile = path.parse(filePath);
    var formattedName = parsedFile.name + "-formatted" + parsedFile.ext;
    var formattedFile = path.join(parsedFile.dir, formattedName);

    if (fs.existsSync(formattedFile)) {
        fs.unlinkSync(formattedFile);
    }

    var lineReader = readline.createInterface({
        input: fs.createReadStream(filePath)
    });

    lineReader.on('line', function (line) {
        fs.appendFileSync(formattedFile, formatLine(line) + "\r\n");
    });

    lineReader.on('close', function (val) {
        console.log("done, check " + formattedFile);
        process.exit(0);
    });
}

function formatLine(jsonedLine) {
    try {
        var lineObj = parseJsonedLine(jsonedLine);
        var formattedLine = `${lineObj.timestamp} [${lineObj.username}] [${lineObj.level}]: ${lineObj.message} ${lineObj.body}`;
        return formattedLine;
    } catch (e) {
        return jsonedLine;
    }
}

function parseJsonedLine(jsonedLine) {
    let line;
    try {
        line = JSON.parse(jsonedLine);
    } catch (e) {
        throw new Error(`invalid line input: ${e}`);
    }

    let {timestamp, message, username, body, level} = line;

    line.message = message && message.replace(/\r?\n|\r/gm, ''); // trim new lines
    line.username = username || "no-context";
    line.body = body || "";
    line.level = level || "";

    if (!timestamp || !message)
        throw new Error("invalid input");

    return line;
}

function printFormattedLine(line) {
    let lineObj, formattedLine;
    try {
        lineObj = parseJsonedLine(line);
        formattedLine = `${lineObj.timestamp} [${lineObj.username}] [${lineObj.level}]: ${lineObj.message} ${lineObj.body}`;

        if (performanceMsThreshold) {
            const currentTimestamp = new Date(lineObj.timestamp).getTime();
            const timeDelta = currentTimestamp - previousTimestamp;
            if (timeDelta > performanceMsThreshold) {
                formattedLine = `${chalk.bold.yellow(`Performance Threshold Hit [${performanceMsThreshold} ms]: ${timeDelta} ms`)}\n\r${formattedLine}`
            }
            previousTimestamp = currentTimestamp;
        }
    } catch (e) {
        formattedLine = line;
    }

    switch (lineObj.level) {
        case "error":
            const error = chalk.bold.red;
            return console.log(error(formattedLine));
        case "warning":
        case "warn": return console.log(chalk.yellow(formattedLine));
        case "debug": return console.log(chalk.gray(formattedLine));
        case "performance":
        default: return console.log(formattedLine);
    }
}

function helpString() {
    return `
    Lagger (${packageJson.version})
    ~~~~~~~~~~~
    Command execution:
    lagger [OPTIONS]
    
    OPTIONS:
    [-f]    
            Path to the file which needs to be formatted.
            i.e. lagger -f=/tmp/file.log 
    
    [-performance-threshold]    
            Performance millisecond gap threshold, if and only if threshold has been hit, log lines will be printted with the time it took (in ms) 
            i.e. lagger -performance-threshold=50000
            
    [-v]    
            Show lagger version.
            i.e. lagger -v
    `
}