import { ChatInputCommandInteraction, EmbedBuilder, hyperlink, SlashCommandBuilder } from 'discord.js';

const embed = new EmbedBuilder()
    .setTitle('Help Information')
    .setDescription(
        [
            'This bot is a custom wishlist container for LaifuBot and an external character database. ',
            'This is not affiliated with LaifuBot. ',
            `\n\n${hyperlink('Commands', 'https://github.com/minidomo/laifuwishlist/blob/main/commands.md')}\n`,
            `${hyperlink('Source Code', 'https://github.com/minidomo/laifuwishlist')}`,
        ].join(''),
    )
    .setFooter({ text: 'Developed by JB#9224' });

export const data = new SlashCommandBuilder()
    .addStringOption(option => option.setName('command').setDescription('Command to check'))
    .setName('help')
    .setDescription('Shows information about the bot');

// eslint-disable-next-line
export async function execute(interaction: ChatInputCommandInteraction, _unique: BotTypes.Unique) {
    await interaction.reply({ embeds: [embed] });
}

// eslint-disable-next-line
export function isPermitted(_interaction: ChatInputCommandInteraction): boolean {
    return true;
}
