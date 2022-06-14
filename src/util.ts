const CUSTOM_ID_REGEX = /(\w+)-(.+)/;

export function getName(customId: string): string {
    const match = customId.match(CUSTOM_ID_REGEX);
    if (match) {
        return match[1];
    }

    return '';
}

export function getLabel(customId: string): string {
    const match = customId.match(CUSTOM_ID_REGEX);
    if (match) {
        return match[2];
    }

    return '';
}
