import { createCharacterMap } from '../../util';

export async function toGachaResultArray(arr: BotTypes.GachaResultSchema[]): Promise<BotTypes.GachaResult[]> {
    const gachaCharacters = arr.filter(isGachaResultCharacterSchema);

    const ids = gachaCharacters.map(e => e.globalId);
    const characterMap = await createCharacterMap(ids, 'global');

    const ret = gachaCharacters.map(
        e =>
            ({
                result: e,
                character: characterMap.get(e.globalId),
            } as BotTypes.GachaResult),
    );

    arr.filter(isGachaResultBadgeSchema).forEach(e => ret.push({ result: e }));

    return ret;
}

export function isGachaResultCharacterSchema(
    result: BotTypes.GachaResultSchema,
): result is BotTypes.GachaResultSchema & BotTypes.GachaResultCharacterSchema {
    return result.gachaType === 'character';
}

export function isGachaResultBadgeSchema(
    result: BotTypes.GachaResultSchema,
): result is BotTypes.GachaResultSchema & BotTypes.GachaResultBadgeSchema {
    return result.gachaType === 'badge';
}
