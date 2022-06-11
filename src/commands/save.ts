import { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';
import { filename, saveEmbeds } from '../embed-storage';

export const data = new SlashCommandBuilder()
    .setName('save')
    .setDescription('Saves the embed file');

export async function execute(interaction: CommandInteraction) {
    saveEmbeds();

    await interaction.reply({
        content: `Saved ${filename}`,
        ephemeral: true,
    });
}
