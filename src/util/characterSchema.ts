import type { AuctionEmbed, BasePersonalSimpleCharacterEmbed, CluCharacter, InfoEmbed } from 'laifutil';

type CloneableObject = Record<string, any>; // eslint-disable-line

function clone<T>(o: T): T {
    const ret: CloneableObject = {};

    Object.keys(o).forEach(key => {
        const obj = o as CloneableObject;
        ret[key] = typeof obj[key] === 'object' ? clone(obj[key]) : obj[key];
    });

    return ret as T;
}

export function fromInfoEmbed(embed: InfoEmbed): BotTypes.PartialCharacterSchema {
    return {
        name: embed.name,
        id: embed.globalId,
        influence: embed.influence,
        rank: clone(embed.rankRange),
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

export function fromCluCharacter(character: CluCharacter): BotTypes.PartialCharacterSchema {
    return {
        id: character.globalId,
        influence: character.influence,
        totalImages: character.totalImages,
        name: character.name,
        'series.title.english': character.title,
    };
}

export function fromAuctionEmbed(embed: AuctionEmbed): BotTypes.PartialCharacterSchema {
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
