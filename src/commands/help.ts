import { hyperlink, SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';

const description = [
    'This bot is a custom wishlist container for LaifuBot and an external character database. ',
    'This is not affiliated with LaifuBot. ',
    `\n\n${hyperlink('Source Code', 'https://github.com/minidomo/laifuwishlist')}`,
].join('');

const everyoneCommands = [
    'modify',
    'help',
    'missing',
    'ping',
    'query',
    'reminder',
    'wishlist',
    'gachahistory toggle',
].sort().join(', ');

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all commmands and information about the bot');

// eslint-disable-next-line
export async function execute(interaction: CommandInteraction, _unique: BotTypes.Unique) {
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

// eslint-disable-next-line
export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}
