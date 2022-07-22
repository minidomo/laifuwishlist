function removeLeadingHyphens(str: string): string {
    const REGEX = /(?<=^-+)(.+)/;

    const match = str.match(REGEX) as RegExpMatchArray;
    return match[1];
}

export function parse(str: string): BotTypes.Flag[] {
    const SEPARATE_REGEX = / +(?=-)/;
    const FLAG_REGEX = /(?<=-[^ ]+) +/;

    const arr = str
        .split(SEPARATE_REGEX)
        .map(flagStr => {
            const parts = flagStr.split(FLAG_REGEX);
            const ret: BotTypes.Flag = { name: removeLeadingHyphens(parts[0]) };

            if (parts.length === 2) {
                ret.value = parts[1];
            }

            return ret;
        })
        .filter(flag => flag.name !== '-');

    return arr;
}
