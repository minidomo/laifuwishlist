import { bold, inlineCode, italic, SlashCommandSubcommandBuilder, time } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BadgeRarity, CharacterRaritySymbol, cleanCharacterName } from 'laifutil';
import { MISSING_INFO } from '../../../constants';
import { User } from '../../../model';
import { Pages } from '../../../structures';
import { Flags } from '../../../util';
import {
    compareBadgeId,
    compareBadgeRarity,
    compareCharacterRarity,
    compareDate,
    compareGlobalId,
    compareInfluence,
    compareName,
} from '../sort';
import { isGachaResultBadgeSchema, isGachaResultCharacterSchema, toGachaResultArray } from '../util';

type SortType =
    | 'influence'
    | 'rev_influence'
    | 'rarity'
    | 'rev_rarity'
    | 'id'
    | 'rev_id'
    | 'name'
    | 'rev_name'
    | 'time'
    | 'rev_time';

export const data = new SlashCommandSubcommandBuilder()
    .addStringOption(option =>
        option
            .setChoices({ name: 'Character', value: 'character' }, { name: 'Badge', value: 'badge' })
            .setName('type')
            .setDescription('Type of gacha')
            .setRequired(true),
    )
    .addStringOption(option => option.setName('filter').setDescription('Filter history when viewing'))
    .addStringOption(option =>
        option
            .setChoices(
                { name: 'Top Influence', value: 'influence' },
                { name: 'Low Influence', value: 'rev_influence' },
                { name: 'Top Rarity', value: 'rarity' },
                { name: 'Low Rarity', value: 'rev_rarity' },
                { name: 'New ID', value: 'id' },
                { name: 'Old ID', value: 'rev_id' },
                { name: 'Name', value: 'name' },
                { name: 'Name Reverse', value: 'rev_name' },
                { name: 'Latest', value: 'time' },
                { name: 'Earliest', value: 'rev_time' },
            )
            .setName('sort')
            .setDescription('Sort history when viewing'),
    )
    .addIntegerOption(option => option.setName('page').setDescription('The page to start on'))
    .setName('show')
    .setDescription('View your gacha history');

export async function execute(interaction: ChatInputCommandInteraction, unique: BotTypes.Unique) {
    await interaction.deferReply();

    const { options, user } = interaction;

    const pageNumber = options.getInteger('page') ?? undefined;
    const sortType = (options.getString('sort') as SortType | null) ?? 'time';
    const filterString = options.getString('filter');
    const gachaType = options.getString('type') as BotTypes.GachaType;

    const targetUser = (await User.findOne({ id: user.id })
        .select('gachaHistory.history')
        .lean()) as BotTypes.LeanUserDocument | null;

    if (targetUser) {
        const startArr = targetUser.gachaHistory.history.filter(e => e.gachaType === gachaType);
        let gachaResultArr = await toGachaResultArray(startArr);

        if (filterString) {
            const filters = Flags.parse(filterString);
            gachaResultArr = applyFilters(gachaResultArr, filters);
        }

        gachaResultArr = applySort(gachaResultArr, gachaType, sortType);

        const lines = createLines(gachaResultArr);

        const embed = new EmbedBuilder()
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setTitle(`Gacha History - ${user.username}`);

        const pages = new Pages({
            interaction,
            unique,
            itemName: 'Gachas',
            lines,
            embed,
        });

        pages.start({ deferred: true, page: pageNumber });
    } else {
        await interaction.editReply({ content: `Could not find gacha history for ${user.username}` });
    }
}

// eslint-disable-next-line
export function isPermitted(_interaction: ChatInputCommandInteraction) {
    return true;
}

function applyFilters(arr: BotTypes.GachaResult[], filters: BotTypes.Flag[]): BotTypes.GachaResult[] {
    if (filters.length < 0) {
        return arr;
    }

    return arr;
}

function applySort(
    arr: BotTypes.GachaResult[],
    gachaType: BotTypes.GachaType,
    sortType: SortType,
): BotTypes.GachaResult[] {
    if (sortType === 'influence' || sortType === 'rev_influence') {
        if (gachaType === 'character') {
            let sorted = arr
                .filter(e => !!e.character)
                .sort((a, b) =>
                    compareInfluence(
                        b.character as BotTypes.LeanCharacterDocument,
                        a.character as BotTypes.LeanCharacterDocument,
                    ),
                );

            if (sortType === 'rev_influence') {
                sorted = sorted.reverse();
            }

            const noCharacters = arr.filter(e => !e.character);
            return [...sorted, ...noCharacters];
        }
    } else if (sortType === 'name' || sortType === 'rev_name') {
        if (gachaType === 'character') {
            let sorted = arr
                .filter(e => !!e.character)
                .sort((a, b) =>
                    compareName(
                        a.character as BotTypes.LeanCharacterDocument,
                        b.character as BotTypes.LeanCharacterDocument,
                    ),
                );

            if (sortType === 'rev_name') {
                sorted = sorted.reverse();
            }

            const noCharacters = arr.filter(e => !e.character);
            return [...sorted, ...noCharacters];
        }
    } else if (sortType === 'time' || sortType === 'rev_time') {
        let sorted = arr.slice().sort((a, b) => -compareDate(a.result.createdAt, b.result.createdAt));

        if (sortType === 'rev_time') {
            sorted = sorted.reverse();
        }

        return sorted;
    } else if (sortType === 'rarity' || sortType === 'rev_rarity') {
        if (gachaType === 'character') {
            let sorted = arr
                .slice()
                .sort((a, b) =>
                    compareCharacterRarity(
                        b.result.rarity as unknown as CharacterRaritySymbol,
                        a.result.rarity as unknown as CharacterRaritySymbol,
                    ),
                );

            if (sortType === 'rev_rarity') {
                sorted = sorted.reverse();
            }

            return sorted;
        } else {
            let sorted = arr
                .slice()
                .sort((a, b) =>
                    compareBadgeRarity(
                        b.result.tier as unknown as BadgeRarity,
                        a.result.rarity as unknown as BadgeRarity,
                    ),
                );

            if (sortType === 'rev_rarity') {
                sorted = sorted.reverse();
            }

            return sorted;
        }
    } else if (sortType === 'id' || sortType === 'rev_id') {
        if (gachaType === 'character') {
            let sorted = arr
                .filter(e => !!e.character)
                .sort((a, b) =>
                    compareGlobalId(
                        a.character as BotTypes.LeanCharacterDocument,
                        b.character as BotTypes.LeanCharacterDocument,
                    ),
                );

            if (sortType === 'rev_id') {
                sorted = sorted.reverse();
            }

            const noCharacters = arr.filter(e => !e.character);
            return [...sorted, ...noCharacters];
        } else {
            let sorted = arr
                .slice()
                .sort((a, b) => compareBadgeId(a.result.badgeId as number, b.result.badgeId as number));

            if (sortType === 'rev_id') {
                sorted = sorted.reverse();
            }

            return sorted;
        }
    }

    return arr;
}

function createLines(arr: BotTypes.GachaResult[]): string[] {
    const ret = arr.map(e => {
        if (isGachaResultCharacterSchema(e.result)) {
            let characterInfo: string = MISSING_INFO;

            if (e.character) {
                characterInfo =
                    `${cleanCharacterName(e.character.name)}・` +
                    `${bold(`${e.character.influence}`)} <:inf:755213119055200336>`;
            }

            // TODO delete later
            const image = e.result.image ?? '?';

            return (
                `${e.result.uniqueId} [${e.result.rarity}] #${image} ${characterInfo} ` +
                `${inlineCode(`(${e.result.globalId})`)}・${time(e.result.createdAt, 'R')}`
            );
        } else if (isGachaResultBadgeSchema(e.result)) {
            const rarityName = BadgeRarity[e.result.tier].replace('_', ' ');
            return `${e.result.badgeId} [${inlineCode(rarityName)}] ${e.result.title}・${time(
                e.result.createdAt,
                'R',
            )}`;
        } else {
            return italic('ERROR');
        }
    });

    return ret;
}
