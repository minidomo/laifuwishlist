import { writeFile, readFile, unlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { setInterval } from 'node:timers';
import dayjs from 'dayjs';
import type {
    Bounds,
    CharacterImageInfo,
    CharacterRarityInfoCollection,
    CharacterSeriesInfo,
    InfoEmbed,
} from 'laifutil';
import { logger } from './logger';

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

export interface BackupMetadata {
    filename: string;
    dateCreated: number;
}

export interface QueryOptions {
    globalId?: number;
}

export type GlobalId = number;

const storage: Map<GlobalId, CharacterEntry> = new Map();
const directory = join(__dirname, '..', 'data');
const BACKUP_FILE_REGEX = /(\d+)-characters\.data/;

const MAX_BACKUPS = 5;
const backups: BackupMetadata[] = [];

// 20 minutes in milliseconds
const interval = 1000 * 60 * 20;

(async () => {
    await loadBackups();
    if (backups.length > 0) {
        importData(backups[backups.length - 1].filename);
    }

    // Export current data every 10 minutes
    setInterval(exportData, interval);
})();

async function loadBackups() {
    const dir = await readdir(directory, { encoding: 'utf-8', withFileTypes: true });
    const tempBackups = dir.filter(e => e.isFile() && BACKUP_FILE_REGEX.test(e.name))
        .map(e => {
            const match = e.name.match(BACKUP_FILE_REGEX) as RegExpMatchArray;
            const backup: BackupMetadata = {
                filename: e.name,
                dateCreated: parseInt(match[1]),
            };
            return backup;
        })
        .sort((a, b) => a.dateCreated - b.dateCreated)
        .slice(0, MAX_BACKUPS);
    backups.push(...tempBackups);
}

export function getBackups(): BackupMetadata[] {
    return backups.slice();
}

async function addBackup(backup: BackupMetadata) {
    if (backups.length === MAX_BACKUPS) {
        await unlink(join(directory, backups[0].filename));
        backups.shift();
    }

    backups.push(backup);
}

export function toString(): string {
    const arr: CharacterEntry[] = [];
    storage.forEach(entry => arr.push(entry));
    return JSON.stringify(arr, null, 0);
}

export function update(embed: InfoEmbed) {
    const entry: CharacterEntry = {
        lastUpdated: dayjs().unix(),
        ...embed,
    };

    storage.set(entry.globalId, entry);
}

export async function importData(filename: string = backups[backups.length - 1].filename): Promise<boolean> {
    try {
        const path = join(directory, filename);

        logger.info(`Importing character database: ${path}`);

        const content = await readFile(path, { encoding: 'utf-8' });
        const arr: CharacterEntry[] = JSON.parse(content);

        arr.forEach(entry => storage.set(entry.globalId, entry));

        logger.info('Sucessfully imported character database');

        return true;
    } catch (err) {
        logger.error('Failed to import character database');
        logger.error(err);

        return false;
    }
}

export async function exportData(): Promise<boolean> {
    try {
        const content = toString();

        const time = dayjs().unix();
        const filename = `${time}-characters.data`;
        const path = join(directory, filename);

        logger.info(`Exporting character database: ${path}`);

        await writeFile(path, content, { encoding: 'utf-8' });

        logger.info('Successfully exported character database');

        await addBackup({
            filename,
            dateCreated: time,
        });

        return true;
    } catch (err) {
        logger.error('Failed to export character database');
        logger.error(err);

        return false;
    }
}

export function query(options: QueryOptions): CharacterEntry | null {
    if (options.globalId) {
        return storage.get(options.globalId) ?? null;
    }

    return null;
}
