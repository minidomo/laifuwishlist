import { SlashCommandBuilder } from '@discordjs/builders';
import dayjs from 'dayjs';
import calender from 'dayjs/plugin/calendar';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { CharacterRarityInfo, RarityConstants } from 'laifutil';
import * as CharacterDatabase from '../CharacterDatabase';

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
        const character = CharacterDatabase.query({ globalId });
        const embed = makeCharacterEmbed(character);

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
    const burnRate = rarity.existingAmount / rarity.totalClaimed * 100;
    return `${rarity.existingAmount}・${rarity.totalClaimed} \`(${burnRate.toFixed(0)}%)\``;
}

function makeCharacterEmbed(character: CharacterDatabase.CharacterEntry | null) {
    const embed = new MessageEmbed();

    if (character === null) {
        embed.setDescription('Could not find character');
    } else {
        embed
            .setTitle(character.characterName)
            .addField('General',
                `**Global ID:** ${character.globalId}\n` +
                `**Total Images:** ${character.totalImages}\n` +
                `**Influence:** ${character.influence}\n` +
                `**Rank:** ${character.influenceRankRange.lower}・${character.influenceRankRange.upper}\n`,
                true)
            .addField('Rarity Keep Rate',
                `**${RarityConstants.ALPHA.symbol}** ${getRarityString(character.rarities.alpha)}\n` +
                `**${RarityConstants.BETA.symbol}** ${getRarityString(character.rarities.beta)}\n` +
                `**${RarityConstants.GAMMA.symbol}** ${getRarityString(character.rarities.gamma)}\n` +
                `**${RarityConstants.DELTA.symbol}** ${getRarityString(character.rarities.delta)}\n` +
                `**${RarityConstants.EPSILON.symbol}** ${getRarityString(character.rarities.epsilon)}\n` +
                `**${RarityConstants.ZETA.symbol}** ${getRarityString(character.rarities.zeta)}\n` +
                `**${RarityConstants.ULTRA.symbol}** ${getRarityString(character.rarities.ultra)}\n`,
                true)
            .addField('Series',
                `**ENG:** ${character.series.englishTitle}\n` +
                `**ALT:** ${character.series.alternateTitle}\n` +
                `**Series ID:** ${character.series.id}\n` +
                `**Sequence:** \`${character.series.sequence}\``,
                false)
            .setFooter({
                text: `Last Updated ${dayjs.unix(character.lastUpdated).calendar(dayjs())}`,
            });
    }

    return embed;
}
