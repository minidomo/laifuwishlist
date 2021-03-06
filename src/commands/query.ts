import dayjs from 'dayjs';
import { bold, ChatInputCommandInteraction, EmbedBuilder, inlineCode, SlashCommandBuilder } from 'discord.js';
import { Bounds, CharacterRarityStatistics, CharacterRaritySymbol } from 'laifutil';
import { Character } from '../model';

export const data = new SlashCommandBuilder()
    .addIntegerOption(option => option.setMinValue(0).setName('global_id').setDescription('Global ID of a character'))
    .setName('query')
    .setDescription('Query the database.');

// eslint-disable-next-line
export async function execute(interaction: ChatInputCommandInteraction, _unique: BotTypes.Unique) {
    const { options } = interaction;

    await interaction.deferReply();

    const globalId = options.getInteger('global_id');

    if (globalId === null) {
        await interaction.editReply({
            content: 'Provide the query with information to get an answer',
        });
    } else {
        const character = (await Character.findOne({ id: globalId }).lean()) as BotTypes.LeanCharacterDocument | null;
        const embed = createCharacterEmbed(character);
        await interaction.editReply({
            embeds: [embed],
        });
    }
}

// eslint-disable-next-line
export function isPermitted(_interaction: ChatInputCommandInteraction): boolean {
    return true;
}

function createRarityString(rarity: CharacterRarityStatistics): string {
    let burnRate = ((rarity.totalClaimed - rarity.existingAmount) / rarity.totalClaimed) * 100;
    if (rarity.totalClaimed === 0) {
        burnRate = 0;
    }
    return `${rarity.existingAmount}・${rarity.totalClaimed} ${inlineCode(`(${burnRate.toFixed(0)}%)`)}`;
}

function createRankString(range: Bounds): string {
    return `${range.lower}・${range.upper}`;
}

function createCharacterEmbed(character: BotTypes.LeanCharacterDocument | null) {
    const embed = new EmbedBuilder().setColor(0xf0b67f);

    if (character === null) {
        embed.setDescription('Could not find character');
    } else {
        const lastUpdated = dayjs(character.updatedAt).format('M/D/YYYY, h:mm:ss A');

        embed
            .setTitle(character.name)
            .addFields([
                {
                    name: 'General',
                    value: `${bold('Global ID:')} ${character.id}\n${bold('Total Images:')} ${
                        character.totalImages
                    }\n${bold('Influence:')} ${character.influence}\n${bold('Rank:')} ${createRankString(
                        character.rank,
                    )}\n`,
                    inline: true,
                },
                {
                    name: 'Rarity Burn Rate',
                    value: `${bold(CharacterRaritySymbol.ALPHA)} ${createRarityString(
                        character.rarities.alpha,
                    )}\n${bold(CharacterRaritySymbol.BETA)} ${createRarityString(character.rarities.beta)}\n${bold(
                        CharacterRaritySymbol.GAMMA,
                    )} ${createRarityString(character.rarities.gamma)}\n${bold(
                        CharacterRaritySymbol.DELTA,
                    )} ${createRarityString(character.rarities.delta)}\n${bold(
                        CharacterRaritySymbol.EPSILON,
                    )} ${createRarityString(character.rarities.epsilon)}\n${bold(
                        CharacterRaritySymbol.ZETA,
                    )} ${createRarityString(character.rarities.zeta)}\n${bold(
                        CharacterRaritySymbol.ULTRA,
                    )} ${createRarityString(character.rarities.ultra)}\n`,
                    inline: true,
                },
                {
                    name: 'Series',
                    value: `${bold('ENG:')} ${character.series.title.english}\n${bold('ALT:')} ${
                        character.series.title.alternate
                    }\n${bold('Series ID:')} ${character.series.id}\n${bold('Sequence:')} ${inlineCode(
                        character.series.sequence,
                    )}\n`,
                },
            ])
            .setFooter({
                text: `Last Updated: ${lastUpdated}`,
            });
    }

    return embed;
}
