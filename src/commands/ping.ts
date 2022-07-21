import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder().setName('ping').setDescription('Replies with pong');

// eslint-disable-next-line
export async function execute(interaction: ChatInputCommandInteraction, _unique: BotTypes.Unique) {
    const embed = new EmbedBuilder().setDescription(`Pong ${interaction.user}!`);

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

// eslint-disable-next-line
export function isPermitted(_interaction: ChatInputCommandInteraction): boolean {
    return true;
}
