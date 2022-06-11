import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';

const commandNames = [
    'add',
    'remove',
    'wishlist',
];

const description = commandNames.join('\n');

export const data = new SlashCommandBuilder()
    .setName('test')
    .setDescription('Displays available commands');

export async function execute(interaction: CommandInteraction) {
    const embed = new MessageEmbed()
        .setTitle('Commands')
        .setDescription(description)
        .setFooter({ text: 'Developed by JB#9224' })
        .setColor('BLURPLE');

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}
