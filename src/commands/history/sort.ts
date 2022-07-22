import dayjs from 'dayjs';
import { BadgeRarity, CharacterRarity, CharacterRaritySymbol, resolveCharacterRarity } from 'laifutil';

export function compareInfluence(a: BotTypes.LeanCharacterDocument, b: BotTypes.LeanCharacterDocument): number {
    return a.influence - b.influence;
}

export function compareName(a: BotTypes.LeanCharacterDocument, b: BotTypes.LeanCharacterDocument): number {
    return a.name < b.name ? -1 : b.name < a.name ? 1 : 0;
}

export function compareDate(a: Date, b: Date): number {
    const ajs = dayjs(a);
    const bjs = dayjs(b);

    return ajs.isBefore(bjs) ? -1 : bjs.isBefore(ajs) ? 1 : 0;
}

export function compareCharacterRarity(a: CharacterRaritySymbol, b: CharacterRaritySymbol): number {
    const aKey = resolveCharacterRarity(a);
    const bKey = resolveCharacterRarity(b);

    return CharacterRarity[aKey] - CharacterRarity[bKey];
}

export function compareBadgeRarity(a: BadgeRarity, b: BadgeRarity): number {
    return a - b;
}

export function compareGlobalId(a: BotTypes.LeanCharacterDocument, b: BotTypes.LeanCharacterDocument): number {
    return a.id - b.id;
}

export function compareBadgeId(a: number, b: number): number {
    return a - b;
}
