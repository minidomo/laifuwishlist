import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';

export const data = new SlashCommandBuilder().setName('ping').setDescription('Replies with pong');

// eslint-disable-next-line
export async function execute(interaction: CommandInteraction, _unique: BotTypes.Unique) {
    const embed = new MessageEmbed().setDescription(`Pong ${interaction.user}!`);

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

// eslint-disable-next-line
export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}
