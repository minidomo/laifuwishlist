import { SlashCommandBuilder } from '@discordjs/builders';
import dayjs from 'dayjs';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Bounds, CharacterRarityInfo, RarityConstants } from 'laifutil';
import { Character } from '../model';

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
        const character = (await Character.findOne({ id: globalId }).exec()) as BotTypes.CharacterDocument | null;
        const embed = createCharacterEmbed(character);
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

function createCharacterEmbed(character: BotTypes.CharacterDocument | null) {
    const embed = new MessageEmbed().setColor(0xF0B67F);

    if (character === null) {
        embed.setDescription('Could not find character');
    } else {
        const lastUpdated = dayjs(character.updatedAt).format('M/D/YYYY, h:mm:ss A');

        embed
            .setTitle(character.name)
            .addField('General',
                `**Global ID:** ${character.id}\n` +
                `**Total Images:** ${character.totalImages}\n` +
                `**Influence:** ${character.influence}\n` +
                `**Rank:** ${createRankString(character.influenceRankRange)}\n`,
                true)
            .addField('Rarity Burn Rate',
                `**${RarityConstants.ALPHA.symbol}** ${createRarityString(character.rarities.alpha)}\n` +
                `**${RarityConstants.BETA.symbol}** ${createRarityString(character.rarities.beta)}\n` +
                `**${RarityConstants.GAMMA.symbol}** ${createRarityString(character.rarities.gamma)}\n` +
                `**${RarityConstants.DELTA.symbol}** ${createRarityString(character.rarities.delta)}\n` +
                `**${RarityConstants.EPSILON.symbol}** ${createRarityString(character.rarities.epsilon)}\n` +
                `**${RarityConstants.ZETA.symbol}** ${createRarityString(character.rarities.zeta)}\n` +
                `**${RarityConstants.ULTRA.symbol}** ${createRarityString(character.rarities.ultra)}\n`,
                true)
            .addField('Series',
                `**ENG:** ${character.series.title.english}\n` +
                `**ALT:** ${character.series.title.alternate}\n` +
                `**Series ID:** ${character.series.id}\n` +
                `**Sequence:** \`${character.series.sequence}\``,
                false)
            .setFooter({
                text: `Last Updated: ${lastUpdated}`,
            });
    }

    return embed;
}
