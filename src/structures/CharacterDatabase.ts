import dayjs from 'dayjs';
import stringify from 'fast-json-stable-stringify';
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
    seriesId?: number;
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
        return stringify(arr);
    }

    query(options: QueryOptions): CharacterEntry | null {
        if (typeof options.globalId === 'number') {
            return this.storage.get(options.globalId) ?? null;
        }

        if (typeof options.seriesId === 'number') {
            const it = this.storage.values();
            for (let cur = it.next(); !cur.done; cur = it.next()) {
                if (cur.value.series.id === options.seriesId) {
                    return cur.value;
                }
            }
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
