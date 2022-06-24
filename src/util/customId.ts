import { randomBytes } from 'node:crypto';

const ID_REGEX = /([\w-]+)$/;
const UNIQUE_LENGTH = 48;
const ID_LENGTH = 51;

export function createUnique(): BotTypes.Unique {
    const ret = randomBytes(UNIQUE_LENGTH / 2).toString('hex');

    if (ret.length !== UNIQUE_LENGTH) {
        throw new Error(`unique is not correct length: (${ret.length}) ${ret}`);
    }

    return ret;
}

export function createCustomId(unique: BotTypes.Unique, id: string): BotTypes.CustomId {
    if (id.length > ID_LENGTH) {
        throw new Error(`id must be less than or equal to ${ID_LENGTH}: ${id}`);
    }

    if (!ID_REGEX.test(id)) {
        throw new Error(`'${id}' does not match regular expression: ${ID_REGEX}`);
    }

    return `${unique} ${id}`;
}

export function getUnique(customId: BotTypes.CustomId): BotTypes.Unique {
    if (customId.length < UNIQUE_LENGTH) {
        throw new Error(`custom id is malformed: ${customId}`);
    }

    return customId.substring(0, UNIQUE_LENGTH);
}

export function getId(customId: BotTypes.CustomId) {
    if (customId.length < UNIQUE_LENGTH) {
        throw new Error(`custom id is malformed: ${customId}`);
    }

    return customId.substring(UNIQUE_LENGTH + 1);
}
