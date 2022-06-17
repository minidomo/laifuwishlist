import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { Bounds, cleanCharacterName } from 'laifutil';
import { character, wishlist } from '../database';
import type { CharacterEntry, WishlistCharacterInternal, WishlistEntryInternal } from '../structures';
import { CustomId } from '../utils';

interface CharacterDescriptionInfo {
    basic: WishlistCharacterInternal;
    character: CharacterEntry | null;
}

type Category = 'series' | 'characters';
const MAX_PER_PAGE = 20;

function getMaxPages(size: number): number {
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
        let targetPage = page;
        const maxPages = getMaxPages(entry.globalIds.size);
        if (page < 1 || page > maxPages) {
            targetPage = 1;
        }

        const data = Array.from(entry.globalIds.values(),
            e => {
                const temp: CharacterDescriptionInfo = {
                    basic: e,
                    character: character.query({ globalId: e.globalId }),
                };

                return temp;
            })
            .sort((a, b) => {
                const aName = a.character?.characterName;
                const bName = b.character?.characterName;

                if (aName && bName) {
                    return aName < bName ? -1 : 1;
                } else if (aName) {
                    return -1;
                } else if (bName) {
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
        return 'TODO';
    }
}

function generateFooter(category: Category, page: number, entry: WishlistEntryInternal): string {
    if (category === 'characters') {
        let targetPage = page;
        const maxPages = getMaxPages(entry.globalIds.size);
        if (page < 1 || page > maxPages) {
            targetPage = 1;
        }

        return `Page ${targetPage}/${maxPages}・Total ${entry.globalIds.size} Characters`;
    } else {
        return 'TODO';
    }
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
        const nextbutton = new MessageButton()
            .setStyle('PRIMARY')
            .setCustomId(CustomId.createCustomId('wishlist', 'next'))
            .setLabel('Next');
        const row = new MessageActionRow().addComponents(prevButton, nextbutton);

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
    } else {
        await interaction.reply({
            content: `No wishlist found for ${targetUser.username}`,
        });
    }
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}
