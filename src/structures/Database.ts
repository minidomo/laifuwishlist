import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { setInterval } from 'node:timers';
import dayjs from 'dayjs';
import type { BackupMetadata } from './types';
import { production } from '../config';
import { logger } from '../utils';

export type DatabaseKey = string | number;
export type DatabaseType = 'wishlist' | 'character';

const branch = production ? 'prod' : 'dev';
const directory = join(__dirname, '..', '..', 'data', branch);
const MAX_BACKUPS = 5;

export abstract class Database<K extends DatabaseKey, V> {
    protected storage: Map<K, V> = new Map();
    protected backups: BackupMetadata[] = [];

    protected abstract fileRegex: RegExp;
    protected abstract exportInterval: number;
    protected abstract databaseType: DatabaseType;

    protected abstract parseContent(content: string): void;
    protected abstract toString(): string;

    protected async loadBackups() {
        const dir = await readdir(directory, { encoding: 'utf-8', withFileTypes: true });
        const tempBackups = dir.filter(e => e.isFile() && this.fileRegex.test(e.name))
            .map(e => {
                const match = e.name.match(this.fileRegex) as RegExpMatchArray;
                const backup: BackupMetadata = {
                    filename: e.name,
                    dateCreated: parseInt(match[1]),
                };
                return backup;
            })
            .sort((a, b) => a.dateCreated - b.dateCreated)
            .slice(0, MAX_BACKUPS);
        this.backups.push(...tempBackups);
    }

    protected async addBackup(backup: BackupMetadata) {
        if (this.backups.length === MAX_BACKUPS) {
            await unlink(join(directory, this.backups[0].filename));
            this.backups.shift();
        }

        this.backups.push(backup);
    }

    async initialize() {
        await this.loadBackups();
        if (this.backups.length > 0) {
            await this.importData();
        }

        setInterval(() => this.exportData(), this.exportInterval);
    }

    getBackups(): BackupMetadata[] {
        return this.backups.slice();
    }

    async importData(backup: BackupMetadata = this.backups[this.backups.length - 1]): Promise<boolean> {
        try {
            const path = join(directory, backup.filename);

            logger.info(`Importing ${this.databaseType} database: ${path}`);

            const content = await readFile(path, { encoding: 'utf-8' });
            this.parseContent(content);

            logger.info(`Sucessfully imported ${this.databaseType} database`);

            return true;
        } catch (err) {
            logger.error(`Failed to import ${this.databaseType} database`);
            console.error(err);

            return false;
        }
    }

    async exportData(): Promise<boolean> {
        try {
            const content = this.toString();

            const time = dayjs().unix();
            const filename = `${time}-${this.databaseType}.data`;
            const path = join(directory, filename);

            logger.info(`Exporting ${this.databaseType} database: ${path}`);

            await writeFile(path, content, { encoding: 'utf-8' });

            logger.info(`Successfully exported ${this.databaseType} database`);

            await this.addBackup({
                filename,
                dateCreated: time,
            });

            return true;
        } catch (err) {
            logger.error(`Failed to export ${this.databaseType} database`);
            console.error(err);

            return false;
        }
    }
}
