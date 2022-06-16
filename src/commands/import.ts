import { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';
import { character, wishlist } from '../database';
import type { CharacterDatabase, DatabaseType, WishlistDatabase } from '../structures';

export const data = new SlashCommandBuilder()
    .addStringOption(option =>
        option
            .setChoices(
                {
                    name: 'Wishlist',
                    value: 'wishlist',
                },
                {
                    name: 'Character',
                    value: 'character',
                },
            )
            .setName('database')
            .setDescription('The type of database')
            .setRequired(true))
    .setName('import')
    .setDescription('Import the database with the latest backup');

export async function execute(interaction: CommandInteraction) {
    const { options } = interaction;

    const databaseType = options.getString('database') as DatabaseType;
    let database: WishlistDatabase | CharacterDatabase;

    if (databaseType === 'character') {
        database = character;
    } else {
        database = wishlist;
    }

    const success = await database.importData();
    let content = '';

    if (success) {
        content = `Successfully imported the ${databaseType} database`;
    } else {
        content = `Failed to import the ${databaseType} database`;
    }

    await interaction.reply({
        content,
        ephemeral: true,
    });
}

