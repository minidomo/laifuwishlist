import { writeFile } from 'node:fs';
import { setInterval } from 'node:timers';
import dayjs from 'dayjs';
import type { APIEmbed } from 'discord-api-types/v9';
import { logger } from './logger';

export const embeds: APIEmbed[] = [];
export const filename = `${dayjs().format('YYYYMMDD-HHmmss')}-embeds.json`;
const dataPath = `${__dirname}/../data/${filename}`;

const interval = 1000 * 60 * 10;
setInterval(saveEmbeds, interval);

export function saveEmbeds() {
    writeFile(dataPath, JSON.stringify(embeds, null, 4), { encoding: 'utf-8' }, err => {
        if (err) {
            logger.info(`error at length ${embeds.length}`);
            logger.error(err);
        }
    });
}
