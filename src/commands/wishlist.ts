import { SlashCommandBuilder } from '@discordjs/builders';
import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    TextChannel,
} from 'discord.js';
import { cleanCharacterName } from 'laifutil';
import { MISSING_INFO } from '../constants';
import { character, wishlist } from '../database';
import type { CharacterEntry, WishlistEntryInternal } from '../structures';
import { capitalize, CustomId, Pages } from '../utils';

interface CharacterDescriptionInfo {
    id: number;
    images: Set<number>;
    character: CharacterEntry | null;
}

interface SeriesDescriptionInfo {
    id: number;
    englishTitle: string | null;
}

interface Args {
    interaction: CommandInteraction;
    row: MessageActionRow;
    category: Category;
    entry: WishlistEntryInternal;
    embed: MessageEmbed,
}

type Label = 'prev' | 'next';
type Category = 'series' | 'characters';

const MAX_LINES_PER_PAGE = 20;
const MAX_IDLE_TIME = 10000;

export const data = new SlashCommandBuilder()
    .addStringOption(option =>
        option
            .setChoices(
                {
                    name: 'Series',
                    value: 'series',
                },
                {
                    name: 'Characters',
                    value: 'characters',
                },
            )
            .setName('category')
            .setDescription('The category to display')
            .setRequired(true))
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('See a user\'s wishlist. Defaults to own wishlist.'))
    .setName('wishlist')
    .setDescription('Shows a user\'s wishlist');

export async function execute(interaction: CommandInteraction) {
    const { options, user } = interaction;

    const category = options.getString('category') as Category;
    const targetUser = options.getUser('user') ?? user;

    const entry = wishlist.getUserInfo(targetUser.id);

    if (entry) {
        const prevButton = new MessageButton()
            .setStyle('PRIMARY')
            .setCustomId(CustomId.createCustomId('wishlist', 'prev'))
            .setLabel('Prev');

        const nextButton = new MessageButton()
            .setStyle('PRIMARY')
            .setCustomId(CustomId.createCustomId('wishlist', 'next'))
            .setLabel('Next');

        const row = new MessageActionRow().addComponents(prevButton, nextButton);

        const embed = new MessageEmbed()
            .setColor(0x28C2FF)
            .setAuthor({
                name: `${targetUser.username}'s Wishlist: ${capitalize(category)}`,
                iconURL: user.avatarURL() ?? user.defaultAvatarURL,
            })
            .setDescription(createDescription(category, 1, entry))
            .setFooter({ text: createFooterText(category, 1, entry) });

        await interaction.reply({
            embeds: [embed],
            components: [row],
        });

        handlePages({ interaction, row, category, entry, embed });
    } else {
        await interaction.reply({ content: `No wishlist found for ${targetUser.username}` });
    }
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}

function createCharactersDescription(page: number, entry: WishlistEntryInternal): string {
    const lastPage = Pages.calculateLastPage(entry.globalIds.size, MAX_LINES_PER_PAGE);
    const targetPage = Pages.clamp(page, lastPage);

    const arr = Array.from(entry.globalIds.values())
        .map(e => {
            const temp: CharacterDescriptionInfo = {
                id: e.globalId,
                images: e.images,
                character: character.query({ globalId: e.globalId }),
            };

            return temp;
        })
        .sort((a, b) => {
            const aVal = a.character?.characterName.toLowerCase();
            const bVal = b.character?.characterName.toLowerCase();

            if (aVal && bVal) {
                return aVal < bVal ? -1 : 1;
            } else if (aVal) {
                return -1;
            } else if (bVal) {
                return 1;
            } else {
                return a.id - b.id;
            }
        });

    const bounds = Pages.calculateBounds(targetPage, arr.length, MAX_LINES_PER_PAGE);

    let ret = '';

    for (let i = bounds.lower; i <= bounds.upper; i++) {
        const e = arr[i];

        let ids = '';
        if (!wishlist.hasAllImages(e.images)) {
            ids = Array.from(e.images).sort().join('');
        }

        let characterInfo: string = MISSING_INFO;
        if (e.character) {
            characterInfo = `${cleanCharacterName(e.character.characterName)}・`
                + `**${e.character.influence}** <:inf:755213119055200336>`;
        }

        ret += `\`${e.id}\` ${characterInfo}${ids}\n`;
    }

    return ret;
}

function createSeriesDescription(page: number, entry: WishlistEntryInternal): string {
    const lastPage = Pages.calculateLastPage(entry.globalIds.size, MAX_LINES_PER_PAGE);
    const targetPage = Pages.clamp(page, lastPage);

    const arr = Array.from(entry.seriesIds)
        .map(id => {
            const temp: SeriesDescriptionInfo = {
                id,
                englishTitle: character.query({ seriesId: id })?.series.englishTitle ?? null,
            };

            return temp;
        })
        .sort((a, b) => {
            const aVal = a.englishTitle?.toLowerCase();
            const bVal = b.englishTitle?.toLowerCase();

            if (aVal && bVal) {
                return aVal < bVal ? -1 : 1;
            } else if (aVal) {
                return -1;
            } else if (bVal) {
                return 1;
            } else {
                return a.id - b.id;
            }
        });

    const bounds = Pages.calculateBounds(targetPage, arr.length, MAX_LINES_PER_PAGE);

    let ret = '';

    for (let i = bounds.lower; i <= bounds.upper; i++) {
        const e = arr[i];
        const title = e.englishTitle ?? MISSING_INFO;
        ret += `\`${e.id}\` ${title}\n`;
    }

    return ret;
}

function createDescription(category: Category, page: number, entry: WishlistEntryInternal): string {
    const description = category === 'characters' ? createCharactersDescription : createSeriesDescription;
    return description(page, entry);
}

function createFooterText(category: Category, page: number, entry: WishlistEntryInternal): string {
    const size = category === 'characters' ? entry.globalIds.size : entry.seriesIds.size;
    const lastPage = Pages.calculateLastPage(size, MAX_LINES_PER_PAGE);
    const targetPage = Pages.clamp(page, lastPage);
    return `Page ${targetPage}/${lastPage}・Total ${size} ${capitalize(category)}`;
}

function handlePages(args: Args) {
    const { interaction, row, category, entry, embed } = args;

    const size = category === 'characters' ? entry.globalIds.size : entry.seriesIds.size;
    const lastPage = Pages.calculateLastPage(size, MAX_LINES_PER_PAGE);

    function filter(i: MessageComponentInteraction): boolean {
        i.deferUpdate();
        return i.user.id === interaction.user.id && CustomId.getGroup(i.customId) === 'wishlist';
    }

    const channel = interaction.channel as TextChannel;
    const collector = channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        idle: MAX_IDLE_TIME,
        filter,
    });

    let curPage = 1;
    collector.on('collect', async i => {
        const label = CustomId.getId(i.customId) as Label;

        if (label === 'next') {
            curPage = Pages.next(curPage, lastPage);
        } else {
            curPage = Pages.previous(curPage, lastPage);
        }

        embed
            .setDescription(createDescription(category, curPage, entry))
            .setFooter({ text: createFooterText(category, curPage, entry) });

        await interaction.editReply({ embeds: [embed] });
    });

    collector.on('end', async () => {
        row.components.forEach(e => e.setDisabled(true));
        await interaction.editReply({ components: [row] });
    });
}
