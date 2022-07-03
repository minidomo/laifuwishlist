import { bold, inlineCode, SlashCommandBuilder } from '@discordjs/builders';
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

    if (globalId === null) {
        await interaction.reply({
            content: 'Provide the query with information to get an answer',
            ephemeral: true,
        });
    } else {
        const character = await Character.findOne({ id: globalId }).lean() as BotTypes.LeanCharacterDocument | null;
        const embed = createCharacterEmbed(character);
        await interaction.reply({
            embeds: [embed],
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
    return `${rarity.existingAmount}・${rarity.totalClaimed} ${inlineCode(`(${burnRate.toFixed(0)}%)`)}`;
}

function createRankString(range: Bounds): string {
    return `${range.lower}・${range.upper}`;
}

function createCharacterEmbed(character: BotTypes.LeanCharacterDocument | null) {
    const embed = new MessageEmbed().setColor(0xF0B67F);

    if (character === null) {
        embed.setDescription('Could not find character');
    } else {
        const lastUpdated = dayjs(character.updatedAt).format('M/D/YYYY, h:mm:ss A');

        embed
            .setTitle(character.name)
            .addField('General',
                `${bold('Global ID:')} ${character.id}\n${
                bold('Total Images:')} ${character.totalImages}\n${
                bold('Influence:')} ${character.influence}\n${
                bold('Rank:')} ${createRankString(character.influenceRankRange)}\n`,
                true)
            .addField('Rarity Burn Rate',
                `${bold(RarityConstants.ALPHA.symbol)} ${createRarityString(character.rarities.alpha)}\n${
                bold(RarityConstants.BETA.symbol)} ${createRarityString(character.rarities.beta)}\n${
                bold(RarityConstants.GAMMA.symbol)} ${createRarityString(character.rarities.gamma)}\n${
                bold(RarityConstants.DELTA.symbol)} ${createRarityString(character.rarities.delta)}\n${
                bold(RarityConstants.EPSILON.symbol)} ${createRarityString(character.rarities.epsilon)}\n${
                bold(RarityConstants.ZETA.symbol)} ${createRarityString(character.rarities.zeta)}\n${
                bold(RarityConstants.ULTRA.symbol)} ${createRarityString(character.rarities.ultra)}\n`,
                true)
            .addField('Series',
                `${bold('ENG:')} ${character.series.title.english}\n${
                bold('ALT:')} ${character.series.title.alternate}\n${
                bold('Series ID:')} ${character.series.id}\n${
                bold('Sequence:')} ${inlineCode(character.series.sequence)}\n`,
                false)
            .setFooter({
                text: `Last Updated: ${lastUpdated}`,
            });
    }

    return embed;
}
