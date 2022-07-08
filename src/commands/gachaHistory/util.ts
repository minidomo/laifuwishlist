import { Character } from '../../model';

export function toGachaResultArray(arr: BotTypes.GachaResultSchema[]): Promise<BotTypes.GachaResult[]> {
    const characters: Map<number, BotTypes.LeanCharacterDocument> = new Map();

    const promises = arr.map(async result => {
        const temp: BotTypes.GachaResult = { result };

        if (isGachaResultCharacterSchema(result)) {
            const res = characters.get(result.globalId);

            if (res) {
                temp.character = res;
            } else {
                const character = await Character.findOne({ id: result.globalId })
                    .lean() as BotTypes.LeanCharacterDocument | null;

                if (character) {
                    temp.character = character;
                    characters.set(result.globalId, character);
                }
            }
        }

        return temp;
    });

    return Promise.all(promises);
}

export function isGachaResultCharacterSchema(result: BotTypes.GachaResultSchema):
    result is BotTypes.GachaResultSchema & BotTypes.GachaResultCharacterSchema {
    return result.gachaType === 'character';
}

export function isGachaResultBadgeSchema(result: BotTypes.GachaResultSchema):
    result is BotTypes.GachaResultSchema & BotTypes.GachaResultBadgeSchema {
    return result.gachaType === 'badge';
}
