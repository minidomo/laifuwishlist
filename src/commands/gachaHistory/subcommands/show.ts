import { bold, inlineCode, italic, SlashCommandSubcommandBuilder, time } from '@discordjs/builders';
import dayjs from 'dayjs';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { cleanCharacterName } from 'laifutil';
import { MISSING_INFO } from '../../../constants';
import { Character, User } from '../../../model';
import { Pages } from '../../../structures';
import { isGachaResultBadgeSchema, isGachaResultCharacterSchema } from '../../../util';

interface GachaResult {
    result: BotTypes.GachaResultSchema;
    character?: BotTypes.LeanCharacterDocument;
}

type SortOption = 'top_influence' | 'low_influence';

export const data = new SlashCommandSubcommandBuilder()
    .addIntegerOption(option =>
        option
            .setName('page')
            .setDescription('The page to start on'))
    .addStringOption(option =>
        option
            .setChoices(
                { name: 'Top Influence', value: 'top_influence' },
                { name: 'Low Influence', value: 'low_influence' },
            )
            .setName('sort')
            .setDescription('Sort history when viewing'),
    )
    .setName('show')
    .setDescription('View your gacha history');

export async function execute(interaction: CommandInteraction, unique: BotTypes.Unique) {
    await interaction.deferReply();

    const { options, user } = interaction;

    const pageNumber = options.getInteger('page') ?? undefined;
    const sortOption = options.getString('sort') as SortOption | null;

    const targetUser = await User.findOne({ id: user.id })
        .select('gachaHistory.history')
        .lean() as BotTypes.LeanUserDocument | null;

    if (targetUser) {
        const arr = await toGachaResultArray(targetUser.gachaHistory.history);
        const sortedArr = sort(arr, sortOption);
        const lines = createLines(sortedArr);

        const embed = new MessageEmbed()
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
export function isPermitted(_interaction: CommandInteraction) {
    return true;
}

function toGachaResultArray(arr: BotTypes.GachaResultSchema[]): Promise<GachaResult[]> {
    const promises = arr.map(async result => {
        const temp: GachaResult = { result };

        if (isGachaResultCharacterSchema(result)) {
            const character = await Character.findOne({ id: result.globalId })
                .lean() as BotTypes.LeanCharacterDocument | null;

            if (character) {
                temp.character = character;
            }
        }

        return temp;
    });

    return Promise.all(promises);
}

function compareDate(a: Date, b: Date): number {
    return dayjs(a).isAfter(dayjs(b)) ? -1 : 1;
}

function sort(arr: GachaResult[], sortOption: SortOption | null): GachaResult[] {
    let ret: GachaResult[];

    if (sortOption === 'top_influence' || sortOption === 'low_influence') {
        const mul = sortOption === 'top_influence' ? -1 : 1;

        ret = arr
            .filter(e => isGachaResultCharacterSchema(e.result))
            .sort((a, b) => {
                const charA = a.character;
                const charB = b.character;

                if (charA && charB) {
                    if (charA.influence === charB.influence) {
                        return compareDate(a.result.createdAt, b.result.createdAt);
                    } else {
                        return (charA.influence - charB.influence) * mul;
                    }
                } else if (charA) {
                    return -1;
                } else if (charB) {
                    return 1;
                } else {
                    return compareDate(a.result.createdAt, b.result.createdAt);
                }
            });
    } else {
        ret = arr.slice().sort((a, b) => compareDate(a.result.createdAt, b.result.createdAt));
    }

    return ret;
}

function createLines(arr: GachaResult[]): string[] {
    const ret = arr.map(e => {
        if (isGachaResultCharacterSchema(e.result)) {
            let characterInfo: string = MISSING_INFO;

            if (e.character) {
                characterInfo = `${cleanCharacterName(e.character.name)}・`
                    + `${bold(`${e.character.influence}`)} <:inf:755213119055200336>`;
            }

            // TODO delete later
            const image = e.result.image ?? '?';

            return `${e.result.uniqueId} [${e.result.rarity}] #${image} ${characterInfo} `
                + `${inlineCode(`(${e.result.globalId})`)}・${time(e.result.createdAt, 'R')}`;
        } else if (isGachaResultBadgeSchema(e.result)) {
            return italic('BADGE SUPPORT WIP');
        } else {
            return italic('ERROR');
        }
    });

    return ret;
}
