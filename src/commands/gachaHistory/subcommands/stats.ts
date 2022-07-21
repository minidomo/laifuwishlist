import { bold, EmbedFooterData, inlineCode, SlashCommandSubcommandBuilder } from '@discordjs/builders';
import dayjs from 'dayjs';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { CharacterRarity, CharacterRarityKey, CharacterRaritySymbol, resolveCharacterRarity } from 'laifutil';
import { INFLUENCE_EMOJI } from '../../../constants';
import { User } from '../../../model';
import { logger } from '../../../util';
import { isGachaResultCharacterSchema, toGachaResultArray } from '../util';

type FilterType = '24hours' | '7days';

export const data = new SlashCommandSubcommandBuilder()
    .addStringOption(option =>
        option
            .setChoices({ name: 'Last 24 Hours', value: '24hours' }, { name: 'Last 7 Days', value: '7days' })
            .setName('filter')
            .setDescription('Get statistics based on filtered data'),
    )
    .setName('stats')
    .setDescription('Show statistics of your gachas');

// eslint-disable-next-line
export async function execute(interaction: CommandInteraction, _unique: BotTypes.Unique) {
    await interaction.deferReply();

    const { options, user } = interaction;

    const filterType = options.getString('filter') as FilterType | null;

    const targetUser = (await User.findOne({ id: user.id })
        .select('gachaHistory.history')
        .lean()) as BotTypes.LeanUserDocument | null;

    if (targetUser) {
        const arr = await toGachaResultArray(filter(targetUser.gachaHistory.history, filterType));

        const embed = new MessageEmbed()
            .addField('Rarity', rarityStats(arr), true)
            .addField('Influence', influenceStats(arr), true)
            .addField('Other', otherStats(arr))
            .setFooter(createFooter(arr))
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setTitle(`Gacha History Statistics - ${user.username}`);

        await interaction.editReply({ embeds: [embed] });
    } else {
        await interaction.editReply({
            content: `No data found for ${user.username}`,
        });
    }
}

// eslint-disable-next-line
export function isPermitted(_interaction: CommandInteraction) {
    return true;
}

function filter(arr: BotTypes.GachaResultSchema[], filterType: FilterType | null): BotTypes.GachaResultSchema[] {
    if (filterType === null) {
        return arr;
    }

    let start: dayjs.Dayjs;

    if (filterType === '24hours') {
        start = dayjs().subtract(24, 'hours');
    } else {
        start = dayjs().subtract(7, 'days');
    }

    return arr.filter(e => dayjs(e.createdAt).isAfter(start));
}

function rarityStats(arr: BotTypes.GachaResult[]): string {
    const rarityCount: Map<CharacterRarityKey, number> = new Map();
    Object.keys(CharacterRarity).forEach(key => rarityCount.set(key as unknown as CharacterRarityKey, 0));

    let characters = 0;

    arr.forEach(e => {
        if (isGachaResultCharacterSchema(e.result)) {
            characters++;
            const key = resolveCharacterRarity(e.result.rarity);
            rarityCount.set(key, (rarityCount.get(key) as number) + 1);
        }
    });

    function rarityLine(rarity: CharacterRarityKey): string {
        const count = rarityCount.get(rarity) as number;
        const percent = characters === 0 ? 0 : (count / characters) * 100;
        return `${bold(CharacterRaritySymbol[rarity])}・${count} ${inlineCode(`${percent.toFixed(0)}%`)}`;
    }

    const ret = [
        rarityLine('ALPHA'),
        rarityLine('BETA'),
        rarityLine('GAMMA'),
        rarityLine('DELTA'),
        rarityLine('EPSILON'),
        rarityLine('ZETA'),
        rarityLine('ULTRA'),
    ].join('\n');

    return ret;
}

function influenceStats(arr: BotTypes.GachaResult[]): string {
    const influences = [0, 200, 400, 700, 1000, 1400, 10000];

    function floorInfluence(influence: number): number {
        for (let i = 0; i < influences.length; i++) {
            if (influence < influences[i]) {
                return influences[i - 1];
            }
        }

        return 0;
    }

    const influenceMap: Map<number, number> = new Map();
    influences.forEach(e => influenceMap.set(e, 0));

    let characters = 0;

    function influenceLine(influence: number): string {
        const percent = characters === 0 ? 0 : ((influenceMap.get(influence) as number) / characters) * 100;
        return `${bold(`+${influence}`)} ${INFLUENCE_EMOJI} ${influenceMap.get(influence)} ${inlineCode(
            `${percent.toFixed(0)}%`,
        )}`;
    }

    arr.forEach(e => {
        if (isGachaResultCharacterSchema(e.result) && e.character) {
            characters++;
            const influence = floorInfluence(e.character.influence);
            influenceMap.set(influence, (influenceMap.get(influence) as number) + 1);
        }
    });

    const ret: string[] = [];

    for (let i = 0; i < influences.length - 1; i++) {
        ret.push(influenceLine(influences[i]));
    }

    return ret.join('\n');
}

function otherStats(arr: BotTypes.GachaResult[]): string {
    let characters = 0;
    const characterSet: Set<number> = new Set();

    let mainSeries = 0;
    let kpopSeries = 0;

    arr.forEach(e => {
        if (isGachaResultCharacterSchema(e.result)) {
            characters++;
            characterSet.add(e.result.globalId);

            if (e.character) {
                if (e.character.series.sequence === 'MAIN') {
                    mainSeries++;
                } else if (e.character.series.sequence === 'K-POP') {
                    kpopSeries++;
                } else {
                    logger.info(e.character.id);
                }
            }
        }
    });

    const duplicates = characters - characterSet.size;

    const ret = [
        `${bold('Unique')}・${characterSet.size}`,
        `${bold('Duplicate')}・${duplicates}`,
        `${bold('Main')}・${mainSeries}`,
        `${bold('K-Pop')}・${kpopSeries}`,
    ].join('\n');

    return ret;
}

function createFooter(arr: BotTypes.GachaResult[]): EmbedFooterData {
    let characters = 0;
    let badges = 0;
    let stones = 0;

    arr.forEach(e => {
        if (isGachaResultCharacterSchema(e.result)) {
            characters++;
        } else {
            badges++;
        }

        stones += e.result.stonesUsed;
    });

    return {
        text: `${characters} Characters | ${badges} Badges | ${stones} Stones used`,
    };
}
