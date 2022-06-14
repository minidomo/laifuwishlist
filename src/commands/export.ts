import { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';
import * as CharacterDatabase from '../CharacterDatabase';

export const data = new SlashCommandBuilder()
    .setName('export')
    .setDescription('Export the database');

export async function execute(interaction: CommandInteraction) {
    const success = await CharacterDatabase.exportData();

    let content = '';

    if (success) {
        content = 'Successfully exported the database';
    } else {
        content = 'Failed to export the database';
    }

    await interaction.reply({
        content,
        ephemeral: true,
    });
}

