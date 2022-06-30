import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';

const description = 'This bot is a custom wishlist container for LaifuBot and an external character database. '
    + 'This is not affiliated with LaifuBot.';

const everyoneCommands = [
    'modfy',
    'help',
    'missing',
    'ping',
    'query',
    'wishlist',
].sort().join(', ');

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all commmands and information about the bot');

export async function execute(interaction: CommandInteraction) {
    const embed = new MessageEmbed()
        .setTitle('Help Information')
        .setColor(0xBC96E6)
        .addField('Commands', everyoneCommands)
        .setDescription(description)
        .setFooter({ text: 'Developed by JB#9224' });

    await interaction.reply({
        embeds: [embed],
    });
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}
