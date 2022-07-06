import type { BasePersonalSimpleCharacterEmbed, InfoEmbed } from 'laifutil';

function clone<T>(o: T): T {
    const ret: Record<string, any> = {};

    Object.keys(o)
        .forEach(key => {
            const obj = o as Record<string, any>;
            ret[key] = typeof obj[key] === 'object' ? clone(obj[key]) : obj[key];
        });

    return ret as T;
}

export function fromInfoEmbed(embed: InfoEmbed): BotTypes.PartialCharacterSchema {
    return {
        name: embed.name,
        id: embed.globalId,
        influence: embed.influence,
        influenceRankRange: clone(embed.influenceRankRange),
        rarities: clone(embed.rarities),
        series: {
            title: {
                alternate: embed.series.title.alternate,
                english: embed.series.title.english,
            },
            id: embed.series.id,
            sequence: embed.series.sequence,
        },
        totalImages: embed.totalImages,
    };
}

export function fromSimpleCharacter(embed: BasePersonalSimpleCharacterEmbed): BotTypes.PartialCharacterSchema {
    return {
        name: embed.name,
        id: embed.globalId,
        influence: embed.influence,
        series: {
            title: {
                alternate: embed.series.title.alternate,
                english: embed.series.title.english,
            },
            id: embed.series.id,
            sequence: embed.series.sequence,
        },
    };
}
