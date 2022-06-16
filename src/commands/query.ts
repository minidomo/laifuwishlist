import { SlashCommandBuilder } from '@discordjs/builders';
import dayjs from 'dayjs';
import calender from 'dayjs/plugin/calendar';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Bounds, CharacterRarityInfo, RarityConstants } from 'laifutil';
import { character } from '../database';
import type { CharacterEntry } from '../structures';

dayjs.extend(calender);

export const data = new SlashCommandBuilder()
    .addIntegerOption(option =>
        option
            .setMinValue(0)
            .setName('global_id')
            .setDescription('Global ID of a character'))
    .setName('query')
    .setDescription('Query a character from the database.');

export async function execute(interaction: CommandInteraction) {
    const { options } = interaction;

    const globalId = options.getInteger('global_id');
    if (globalId) {
        const characterInfo = character.query({ globalId });
        const embed = makeCharacterEmbed(characterInfo);

        await interaction.reply({
            embeds: [embed],
        });
    } else {
        await interaction.reply({
            content: 'Provide the query with information to get an answer',
            ephemeral: true,
        });
    }
}

function getRarityString(rarity: CharacterRarityInfo): string {
    const burnRate = (rarity.totalClaimed - rarity.existingAmount) / rarity.totalClaimed * 100;
    return `${rarity.existingAmount}・${rarity.totalClaimed} \`(${burnRate.toFixed(0)}%)\``;
}

function getRankString(range: Bounds): string {
    const lower = Math.min(range.lower, range.upper);
    const upper = Math.max(range.lower, range.upper);
    return `${lower}・${upper}`;
}

function makeCharacterEmbed(characterInfo: CharacterEntry | null) {
    const embed = new MessageEmbed();

    if (characterInfo === null) {
        embed.setDescription('Could not find character');
    } else {
        const lastUpdated = dayjs.unix(characterInfo.lastUpdated).format('MM/DD/YYYY, h:mm:ss A');

        embed
            .setTitle(characterInfo.characterName)
            .addField('General',
                `**Global ID:** ${characterInfo.globalId}\n` +
                `**Total Images:** ${characterInfo.totalImages}\n` +
                `**Influence:** ${characterInfo.influence}\n` +
                `**Rank:** ${getRankString(characterInfo.influenceRankRange)}\n`,
                true)
            .addField('Rarity Burn Rate',
                `**${RarityConstants.ALPHA.symbol}** ${getRarityString(characterInfo.rarities.alpha)}\n` +
                `**${RarityConstants.BETA.symbol}** ${getRarityString(characterInfo.rarities.beta)}\n` +
                `**${RarityConstants.GAMMA.symbol}** ${getRarityString(characterInfo.rarities.gamma)}\n` +
                `**${RarityConstants.DELTA.symbol}** ${getRarityString(characterInfo.rarities.delta)}\n` +
                `**${RarityConstants.EPSILON.symbol}** ${getRarityString(characterInfo.rarities.epsilon)}\n` +
                `**${RarityConstants.ZETA.symbol}** ${getRarityString(characterInfo.rarities.zeta)}\n` +
                `**${RarityConstants.ULTRA.symbol}** ${getRarityString(characterInfo.rarities.ultra)}\n`,
                true)
            .addField('Series',
                `**ENG:** ${characterInfo.series.englishTitle}\n` +
                `**ALT:** ${characterInfo.series.alternateTitle}\n` +
                `**Series ID:** ${characterInfo.series.id}\n` +
                `**Sequence:** \`${characterInfo.series.sequence}\``,
                false)
            .setFooter({
                text: `Last Updated: ${lastUpdated}`,
            });
    }

    return embed;
}
