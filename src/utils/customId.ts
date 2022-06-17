const GROUP_REGEX = /^([^-]+)/;
const ID_REGEX = /(.+)$/;
const CUSTOM_ID_REGEX = new RegExp([
    GROUP_REGEX,
    /-/,
    ID_REGEX,
].map(e => e.source).join(''));

export type CustomId = string;

export function createCustomId(group: string, id: string): CustomId {
    if (!GROUP_REGEX.test(group)) {
        throw new Error(`'${group}' does not match regular expression: ${GROUP_REGEX}`);
    }

    if (!ID_REGEX.test(id)) {
        throw new Error(`'${id}' does not match regular expression: ${ID_REGEX}`);
    }

    return `${group}-${id}`;
}

export function getGroup(customId: CustomId) {
    const match = customId.match(CUSTOM_ID_REGEX);

    if (!match) {
        throw new Error(`'${customId}' does not match regular expression: ${CUSTOM_ID_REGEX}`);
    }

    return match[1];
}

export function getId(customId: CustomId) {
    const match = customId.match(CUSTOM_ID_REGEX);

    if (!match) {
        throw new Error(`'${customId}' does not match regular expression: ${CUSTOM_ID_REGEX}`);
    }

    return match[2];
}
