import { Database, DatabaseType } from './Database';

export interface WishlistEntry {
    userId: string;
    seriesIds: number[];
    globalIds: WishlistGlobalId[];
    guildIds: number[];
}

export interface WishlistGlobalId {
    globalId: number;
    all: boolean;
    images: number[];
}

export type UserId = string;

export class WishlistDatabase extends Database<UserId, WishlistEntry> {
    protected fileRegex = /(\d+)-wishlist\.data/;
    protected exportInterval: number = 1000 * 60 * 20;
    protected databaseType: DatabaseType = 'wishlist';

    protected parseContent(content: string): void {
        const arr: WishlistEntry[] = JSON.parse(content);
        arr.forEach(entry => this.storage.set(entry.userId, entry));
    }

    protected toString(): string {
        const arr: WishlistEntry[] = [];
        this.storage.forEach(entry => arr.push(entry));
        return JSON.stringify(arr, null, 0);
    }

    search(globalId: number, seriesId: number, imageNumber: number): UserId[] {
        const userIds: UserId[] = [];

        this.storage.forEach((entry, id) => {
            if (entry.seriesIds.includes(seriesId)) {
                userIds.push(id);
            } else {
                const character = entry.globalIds.find(e => e.globalId === globalId);
                if (character && (character.all || character.images.includes(imageNumber))) {
                    userIds.push(id);
                }
            }
        });

        return userIds;
    }
}
