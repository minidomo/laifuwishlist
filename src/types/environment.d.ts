declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DEV_DISCORD_TOKEN: string;
            DEV_DISCORD_CLIENT_ID: string;
            DEV_GUILD_IDS: string;
            DEV_DATABASE_URI: string;

            PROD_DISCORD_TOKEN: string;
            PROD_DISCORD_CLIENT_ID: string;
            PROD_GUILD_IDS: string;
            PROD_DATABASE_URI: string;

            OWNER_CLIENT_ID: string;

            SAVE_LOGS: string;
        }
    }
}

export {};
