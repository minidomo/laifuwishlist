import { SlashCommandBuilder } from '@discordjs/builders';
import dayjs from 'dayjs';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Bounds, CharacterRarityInfo, RarityConstants } from 'laifutil';
import { character } from '../database';
import type { CharacterEntry } from '../structures';

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
    if (typeof globalId === 'number') {
        const characterInfo = character.query({ globalId });
        const embed = createCharacterEmbed(characterInfo);
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

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}

function createRarityString(rarity: CharacterRarityInfo): string {
    let burnRate = (rarity.totalClaimed - rarity.existingAmount) / rarity.totalClaimed * 100;
    if (rarity.totalClaimed === 0) {
        burnRate = 0;
    }
    return `${rarity.existingAmount}・${rarity.totalClaimed} \`(${burnRate.toFixed(0)}%)\``;
}

function createRankString(range: Bounds): string {
    const lower = Math.min(range.lower, range.upper);
    const upper = Math.max(range.lower, range.upper);
    return `${lower}・${upper}`;
}

function createCharacterEmbed(characterInfo: CharacterEntry | null) {
    const embed = new MessageEmbed().setColor(0xF0B67F);

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
                `**Rank:** ${createRankString(characterInfo.influenceRankRange)}\n`,
                true)
            .addField('Rarity Burn Rate',
                `**${RarityConstants.ALPHA.symbol}** ${createRarityString(characterInfo.rarities.alpha)}\n` +
                `**${RarityConstants.BETA.symbol}** ${createRarityString(characterInfo.rarities.beta)}\n` +
                `**${RarityConstants.GAMMA.symbol}** ${createRarityString(characterInfo.rarities.gamma)}\n` +
                `**${RarityConstants.DELTA.symbol}** ${createRarityString(characterInfo.rarities.delta)}\n` +
                `**${RarityConstants.EPSILON.symbol}** ${createRarityString(characterInfo.rarities.epsilon)}\n` +
                `**${RarityConstants.ZETA.symbol}** ${createRarityString(characterInfo.rarities.zeta)}\n` +
                `**${RarityConstants.ULTRA.symbol}** ${createRarityString(characterInfo.rarities.ultra)}\n`,
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
