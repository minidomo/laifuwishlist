import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong');

export async function execute(interaction: CommandInteraction) {
    const embed = new MessageEmbed()
        .setDescription(`Pong ${interaction.user}!`);

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}
