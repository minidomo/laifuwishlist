import * as process from 'node:process';
import * as config from './config.json';

if (!process.argv.some(arg => arg === '--prod' || arg === '--dev')) {
    throw new Error('--prod or --dev must be passed as an argument');
}

export const production: boolean = process.argv.includes('--prod');

export const token: string = production ? config.prod.token : config.dev.token;

export const guildsIds: string[] = production ? config.prod.guildIds : config.dev.guildIds;

export const clientId: string = production ? config.prod.clientId : config.dev.clientId;
