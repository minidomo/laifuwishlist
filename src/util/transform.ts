import type { InfoEmbed } from 'laifutil';

interface Cloneable {
    [key: string]: any;
}

function clone<T>(o: T): T {
    const ret: Cloneable = {};

    Object.keys(o)
        .forEach(key => {
            const obj = o as Cloneable;
            ret[key] = typeof obj[key] === 'object' ? clone(obj[key]) : obj[key];
        });

    return ret as T;
}

export function infoEmbedToCharacterSchema(embed: InfoEmbed): BotTypes.CharacterSchema {
    const ret: BotTypes.CharacterSchema = {
        name: embed.characterName,
        id: embed.globalId,
        influence: embed.influence,
        influenceRankRange: {
            lower: Math.min(embed.influenceRankRange.lower, embed.influenceRankRange.upper),
            upper: Math.max(embed.influenceRankRange.lower, embed.influenceRankRange.upper),
        },
        rarities: clone(embed.rarities),
        series: {
            title: {
                alternate: embed.series.alternateTitle,
                english: embed.series.englishTitle,
            },
            id: embed.series.id,
            sequence: embed.series.sequence,
        },
        totalImages: embed.totalImages,
    };

    return ret;
}
