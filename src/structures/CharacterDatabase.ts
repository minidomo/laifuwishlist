import dayjs from 'dayjs';
import type {
    Bounds,
    CharacterImageInfo,
    CharacterRarityInfoCollection,
    CharacterSeriesInfo,
    InfoEmbed,
} from 'laifutil';
import { Database, DatabaseType } from './Database';

export interface CharacterEntry {
    lastUpdated: number;
    image: CharacterImageInfo;
    characterName: string;
    globalId: number;
    totalImages: number;
    series: CharacterSeriesInfo;
    influence: number;
    influenceRankRange: Bounds;
    rarities: CharacterRarityInfoCollection;
}

export type GlobalId = number;

export interface QueryOptions {
    globalId?: number;
}

export class CharacterDatabase extends Database<GlobalId, CharacterEntry> {
    protected fileRegex = /(\d+)-character\.data/;
    protected exportInterval: number = 1000 * 60 * 20;
    protected databaseType: DatabaseType = 'character';

    protected parseContent(content: string): void {
        const arr: CharacterEntry[] = JSON.parse(content);
        arr.forEach(entry => this.storage.set(entry.globalId, entry));
    }

    protected toString(): string {
        const arr: CharacterEntry[] = [];
        this.storage.forEach(entry => arr.push(entry));
        return JSON.stringify(arr, null, 0);
    }

    query(options: QueryOptions): CharacterEntry | null {
        if (options.globalId) {
            return this.storage.get(options.globalId) ?? null;
        }

        return null;
    }

    update(embed: InfoEmbed) {
        const entry: CharacterEntry = {
            lastUpdated: dayjs().unix(),
            ...embed,
        };

        this.storage.set(entry.globalId, entry);
    }
}
