

export class FormatterUtils {

    public static getFormattedTags(tags: string[]): string {
        if (!tags || tags.length === 0) {
            return "";
        }
        let result = "";
        for (let i = 0, len = tags.length; i < len; i++) {
           result += `[${tags[i]}]`
        }
        return result;
    }

}
