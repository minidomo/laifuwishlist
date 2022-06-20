import stringify from 'fast-json-stable-stringify';
import { Database, DatabaseType } from './Database';

export interface WishlistEntry {
    userId: string;
    seriesIds: number[];
    globalIds: WishlistCharacter[];
    guildIds: string[];
}

export interface WishlistCharacter {
    globalId: number;
    images: number[];
}

export interface WishlistEntryInternal {
    userId: string;
    seriesIds: Set<number>;
    globalIds: Map<number, WishlistCharacterInternal>;
    guildIds: Set<string>;
}

export interface WishlistCharacterInternal {
    globalId: number;
    images: Set<number>;
}

export type UserId = string;
export type Action = 'add' | 'remove';

function interalize(entry: WishlistEntry): WishlistEntryInternal {
    const ret: WishlistEntryInternal = {
        userId: entry.userId,
        seriesIds: new Set(entry.seriesIds),
        globalIds: new Map(),
        guildIds: new Set(entry.guildIds),
    };

    entry.globalIds.forEach(character => {
        const temp: WishlistCharacterInternal = {
            globalId: character.globalId,
            images: new Set(character.images),
        };

        ret.globalIds.set(temp.globalId, temp);
    });

    return ret;
}

function uninteralize(entry: WishlistEntryInternal): WishlistEntry {
    const ret: WishlistEntry = {
        userId: entry.userId,
        seriesIds: Array.from(entry.seriesIds),
        globalIds: Array.from(entry.globalIds.values(), character => {
            const temp: WishlistCharacter = {
                globalId: character.globalId,
                images: Array.from(character.images),
            };

            return temp;
        }),
        guildIds: Array.from(entry.guildIds),
    };

    return ret;
}

function addCharacter(map: Map<number, WishlistCharacterInternal>, character: WishlistCharacterInternal) {
    let entry = map.get(character.globalId);

    if (!entry) {
        entry = {
            globalId: character.globalId,
            images: new Set(),
        };

        map.set(entry.globalId, entry);
    }

    character.images.forEach(e => (entry as WishlistCharacterInternal).images.add(e));
}

function removeCharacter(map: Map<number, WishlistCharacterInternal>, character: WishlistCharacterInternal) {
    const entry = map.get(character.globalId);

    if (entry) {
        character.images.forEach(e => entry.images.delete(e));
        if (entry.images.size === 0) {
            map.delete(character.globalId);
        }
    }
}

export class WishlistDatabase extends Database<UserId, WishlistEntryInternal> {
    protected fileRegex = /(\d+)-wishlist\.data/;
    protected exportInterval: number = 1000 * 60 * 20;
    protected databaseType: DatabaseType = 'wishlist';

    protected parseContent(content: string): void {
        const arr: WishlistEntry[] = JSON.parse(content);
        arr.forEach(entry => this.storage.set(entry.userId, interalize(entry)));
    }

    protected toString(): string {
        const arr: WishlistEntry[] = [];
        this.storage.forEach(entry => arr.push(uninteralize(entry)));
        return stringify(arr);
    }

    getUserInfo(userId: string): WishlistEntryInternal | null {
        return this.storage.get(userId) ?? null;
    }

    hasAllImages(data: WishlistCharacterInternal | Set<number>): boolean {
        let images: Set<number>;

        if (data instanceof Set) {
            images = data;
        } else {
            images = data.images;
        }

        let ret = true;

        for (let i = 1; i <= 9; i++) {
            ret &&= images.has(i);
        }

        return ret;
    }

    update(action: Action, userId: string, guildId: string, data: WishlistCharacterInternal | number) {
        let entry = this.storage.get(userId);

        if (!entry) {
            entry = {
                userId,
                seriesIds: new Set(),
                globalIds: new Map(),
                guildIds: new Set(),
            };

            this.storage.set(userId, entry);
        }

        entry.guildIds.add(guildId);

        if (action === 'add') {
            if (typeof data === 'number') {
                entry.seriesIds.add(data);
            } else {
                addCharacter(entry.globalIds, data);
            }
        } else if (typeof data === 'number') {
                entry.seriesIds.delete(data);
            } else {
                removeCharacter(entry.globalIds, data);
            }
    }

    search(guildId: string, globalId: number, seriesId: number, imageNumber: number): UserId[] {
        const userIds: UserId[] = [];

        this.storage.forEach((entry, id) => {
            if (!entry.guildIds.has(guildId)) return;

            if (entry.seriesIds.has(seriesId)) {
                userIds.push(id);
            } else {
                const character = entry.globalIds.get(globalId);
                if (character && character.images.has(imageNumber)) {
                    userIds.push(id);
                }
            }
        });

        return userIds;
    }
}
