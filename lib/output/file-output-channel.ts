import {Formatter} from "../formatters/formatter-types";
import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";
import {OutputChannel} from "./output-types";


export class FileOutputChannel implements OutputChannel {

    constructor(private filePath: string) {}

    public output(lineFormatter: Formatter): void {
        console.log("formatting file: " + this.filePath);
        const parsedFile = path.parse(this.filePath);
        const formattedName = parsedFile.name + "-formatted" + parsedFile.ext;
        const formattedFile = path.join(parsedFile.dir, formattedName);

        if (fs.existsSync(formattedFile)) {
            fs.unlinkSync(formattedFile);
        }

        var lineReader = readline.createInterface({
            input: fs.createReadStream(this.filePath)
        });

        lineReader.on('line', (line: string) => {
            fs.appendFileSync(formattedFile, lineFormatter.formatLine(line).formattedLine + "\r\n");
        });

        lineReader.on('close', (val:any) => {
            console.log("done, check " + formattedFile);
            process.exit(0);
        });
    }
}
