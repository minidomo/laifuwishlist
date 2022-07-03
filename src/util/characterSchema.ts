import type { BaseSimpleCharacter, InfoEmbed } from 'laifutil';

function clone<T>(o: T): T {
    const ret: Record<string, any> = {};

    Object.keys(o)
        .forEach(key => {
            const obj = o as Record<string, any>;
            ret[key] = typeof obj[key] === 'object' ? clone(obj[key]) : obj[key];
        });

    return ret as T;
}

export function fromInfoEmbed(embed: InfoEmbed): BotTypes.CharacterSchema {
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

export function fromSimpleCharacter(embed: BaseSimpleCharacter): BotTypes.PartialCharacterSchema {
    const ret: BotTypes.PartialCharacterSchema = {
        name: embed.characterName,
        id: embed.globalId,
        influence: embed.influence,
        series: {
            title: {
                alternate: embed.series.alternateTitle,
                english: embed.series.englishTitle,
            },
            id: embed.series.id,
            sequence: embed.series.sequence,
        },
    };

    return ret;
}
