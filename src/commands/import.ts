import { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';
import * as CharacterDatabase from '../CharacterDatabase';

export const data = new SlashCommandBuilder()
    .setName('import')
    .setDescription('Import the database with the latest backup');

export async function execute(interaction: CommandInteraction) {
    const success = await CharacterDatabase.importData();

    let content = '';

    if (success) {
        content = 'Successfully imported the database';
    } else {
        content = 'Failed to import the database';
    }

    await interaction.reply({
        content,
        ephemeral: true,
    });
}

