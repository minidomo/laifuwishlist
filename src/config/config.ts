import { argv, env } from 'node:process';

if (!argv.some(arg => arg === '--prod' || arg === '--dev')) {
    throw new Error('--prod or --dev must be passed as an argument');
}

export const production: boolean = argv.includes('--prod');

export const token = production ? env.PROD_DISCORD_TOKEN : env.DEV_DISCORD_TOKEN;

const guildIdsString = production ? env.PROD_GUILD_IDS : env.DEV_GUILD_IDS;
export const guildsIds = guildIdsString.split(',');

export const clientId = production ? env.PROD_DISCORD_CLIENT_ID : env.DEV_DISCORD_CLIENT_ID;

export const ownerClientId = env.OWNER_CLIENT_ID;

export const databaseUri = production ? env.PROD_DATABASE_URI : env.DEV_DATABASE_URI;

export const saveLogs = env.SAVE_LOGS === '1';
