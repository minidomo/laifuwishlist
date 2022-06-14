import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with pong!');

export async function execute(interaction: CommandInteraction) {
    const embed = new MessageEmbed()
        .setDescription(`Pong ${interaction.user}!`)
        .setFooter({ text: 'Developed by JB#9224' })
        .setColor('BLURPLE');

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

