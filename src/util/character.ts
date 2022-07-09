import { Character } from '../model';

export async function createCharacterMap(ids: number[], type: BotTypes.IdType, select?: string):
    Promise<Map<number, BotTypes.LeanCharacterDocument>> {
    const ret: Map<number, BotTypes.LeanCharacterDocument> = new Map();

    let characters: BotTypes.LeanCharacterDocument[];

    if (select) {
        if (type === 'global') {
            characters = await Character.find({})
                .select(`id ${select}`)
                .lean() as BotTypes.LeanCharacterDocument[];
        } else {
            characters = await Character.find({})
                .select(`series.id ${select}`)
                .lean() as BotTypes.LeanCharacterDocument[];
        }
    } else {
        characters = await Character.find({}).lean() as BotTypes.LeanCharacterDocument[];
    }

    const idSet = new Set(ids);

    characters.forEach(e => {
        if (type === 'global') {
            if (idSet.has(e.id)) {
                ret.set(e.id, e);
            }
        } else if (idSet.has(e.series.id)) {
            ret.set(e.series.id, e);
        }
    });

    return ret;
}
