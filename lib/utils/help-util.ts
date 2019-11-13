
const packageJson = require('../../package.json');


export class HelpUtil {

    public static getHelpString(): string {
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

}
