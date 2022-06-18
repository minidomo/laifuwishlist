import { SlashCommandBuilder } from '@discordjs/builders';
import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    TextChannel,
} from 'discord.js';
import { Bounds, cleanCharacterName } from 'laifutil';
import { character, wishlist } from '../database';
import type { CharacterEntry, WishlistCharacterInternal, WishlistEntryInternal } from '../structures';
import { CustomId } from '../utils';

interface CharacterDescriptionInfo {
    basic: WishlistCharacterInternal;
    character: CharacterEntry | null;
}
interface SeriesDescriptionInfo {
    id: number;
    englishTitle: string | null;
}

type Label = 'prev' | 'next';
type Category = 'series' | 'characters';
const MAX_PER_PAGE = 20;
const MAX_IDLE_TIME = 10000;

function getLastPage(size: number): number {
    if (size === 0) {
        return 1;
    }
    return Math.ceil(size / MAX_PER_PAGE);
}

function getPageBounds(page: number, max: number): Bounds {
    return {
        lower: (page - 1) * MAX_PER_PAGE,
        upper: Math.min(page * MAX_PER_PAGE - 1, max),
    };
}

function generateDescription(category: Category, page: number, entry: WishlistEntryInternal): string {
    if (category === 'characters') {
        const lastPage = getLastPage(entry.globalIds.size);
        const targetPage = page < 1 || page > lastPage ? 1 : page;

        const data = Array.from(entry.globalIds.values())
            .map(e => {
                const temp: CharacterDescriptionInfo = {
                    basic: e,
                    character: character.query({ globalId: e.globalId }),
                };

                return temp;
            })
            .sort((a, b) => {
                const aVal = a.character?.characterName;
                const bVal = b.character?.characterName;

                if (aVal && bVal) {
                    return aVal < bVal ? -1 : 1;
                } else if (aVal) {
                    return -1;
                } else if (bVal) {
                    return 1;
                } else {
                    return a.basic.globalId - b.basic.globalId;
                }
            });

        const bounds = getPageBounds(targetPage, data.length - 1);

        let ret = '';

        for (let i = bounds.lower; i <= bounds.upper; i++) {
            const e = data[i];

            const ids = Array.from(e.basic.images).sort().join('');
            const all = ids === '123456789';

            let idsText = ` \`[${ids}]\``;
            if (all) {
                idsText = '';
            }

            let characterInfo = '*MISSING INFO*';
            if (e.character) {
                characterInfo = `${cleanCharacterName(e.character.characterName)}・**${e.character.influence}**`;
            }

            ret += `\`${e.basic.globalId}\` ${characterInfo}${idsText}\n`;
        }

        return ret;
    } else {
        const lastPage = getLastPage(entry.globalIds.size);
        const targetPage = page < 1 || page > lastPage ? 1 : page;

        const data = Array.from(entry.seriesIds)
            .map(id => {
                const temp: SeriesDescriptionInfo = {
                    id,
                    englishTitle: character.query({ seriesId: id })?.series.englishTitle ?? null,
                };

                return temp;
            })
            .sort((a, b) => {
                const aVal = a.englishTitle;
                const bVal = b.englishTitle;

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

        const bounds = getPageBounds(targetPage, data.length - 1);

        let ret = '';

        for (let i = bounds.lower; i <= bounds.upper; i++) {
            const e = data[i];
            const title = e.englishTitle ?? '*MISSING INFO*';
            ret += `\`${e.id}\` ${title}\n`;
        }

        return ret;
    }
}

function generateFooter(category: Category, page: number, entry: WishlistEntryInternal): string {
    const size = category === 'characters' ? entry.globalIds.size : entry.seriesIds.size;
    const lastPage = getLastPage(size);
    const targetPage = page < 1 || page > lastPage ? 1 : page;

    return `Page ${targetPage}/${lastPage}・Total ${size} ${category[0].toUpperCase()}${category.substring(1)}`;
}

interface Args {
    interaction: CommandInteraction;
    row: MessageActionRow;
    category: Category;
    entry: WishlistEntryInternal;
    embed: MessageEmbed,
}

function handleInteractions(args: Args) {
    const { interaction, row, category, entry, embed } = args;
    let curPage = 1;

    const size = category === 'characters' ? entry.globalIds.size : entry.seriesIds.size;
    const lastPage = getLastPage(size);

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

    collector.on('collect', async i => {
        const label = CustomId.getId(i.customId) as Label;

        if (label === 'next') {
            curPage = ((curPage - 1) + 1 + lastPage) % lastPage + 1;
        } else {
            curPage = ((curPage - 1) - 1 + lastPage) % lastPage + 1;
        }

        embed
            .setDescription(generateDescription(category, curPage, entry))
            .setFooter({
                text: generateFooter(category, curPage, entry),
            });

        await interaction.editReply({
            embeds: [embed],
        });
    });

    collector.on('end', async () => {
        row.components.forEach(e => e.setDisabled(true));

        await interaction.editReply({
            components: [row],
        });
    });
}

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
                name: `${targetUser.username}'s Wishlist: ${category[0].toUpperCase()}${category.substring(1)}`,
                iconURL: user.avatarURL() ?? user.defaultAvatarURL,
            })
            .setDescription(generateDescription(category, 1, entry))
            .setFooter({
                text: generateFooter(category, 1, entry),
            });

        await interaction.reply({
            embeds: [embed],
            components: [row],
        });

        handleInteractions({ interaction, row, category, entry, embed });
    } else {
        await interaction.reply({
            content: `No wishlist found for ${targetUser.username}`,
        });
    }
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}
