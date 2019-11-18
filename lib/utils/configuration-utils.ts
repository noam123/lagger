import {FormatterOptions} from "../formatters/formatter-types";


const LAGGER_ENVIRONMENT_VARIABLES: Map<string, string> = new Map([
    ["LAGGER_SILENT_FORMATTER_ERRORS", "silentFormatterErrors"]
]);

export class ConfigurationUtils {

    /**
     * Extract Lagger env vars and init them as formatter options
     */
    public static initEnvironmentVariablesConf(): FormatterOptions {
        let laggerEnvVarsOptions:FormatterOptions = Object.create(null);

        LAGGER_ENVIRONMENT_VARIABLES.forEach((formatterOptionName, environmentVariableName) => {
            const environmentVariableValue = process.env[environmentVariableName];
            laggerEnvVarsOptions = {
                ...laggerEnvVarsOptions,
                ...(process.env[environmentVariableName]) && {[formatterOptionName]: environmentVariableValue}
            };
        });

        return  laggerEnvVarsOptions;
    }

}
