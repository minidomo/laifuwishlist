import { SlashCommandBuilder } from '@discordjs/builders';
import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
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

type Category = 'series' | 'characters';

const MAX_LINES_PER_PAGE = 20;

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
    const unique = CustomId.createUnique();

    const category = options.getString('category') as Category;
    const targetUser = options.getUser('user') ?? user;

    const entry = wishlist.getUserInfo(targetUser.id);

    if (entry) {
        const prevButton = new MessageButton()
            .setStyle('PRIMARY')
            .setCustomId(CustomId.createCustomId(unique, 'prev'))
            .setLabel('Prev');

        const nextButton = new MessageButton()
            .setStyle('PRIMARY')
            .setCustomId(CustomId.createCustomId(unique, 'next'))
            .setLabel('Next');

        const row = new MessageActionRow().addComponents(prevButton, nextButton);
        const lines = createLines(category, entry);

        const embed = new MessageEmbed()
            .setColor(0x28C2FF)
            .setAuthor({
                name: `${targetUser.username}'s Wishlist: ${capitalize(category)}`,
                iconURL: user.avatarURL() ?? user.defaultAvatarURL,
            })
            .setDescription(Pages.createDescription(lines, 1, MAX_LINES_PER_PAGE))
            .setFooter({ text: Pages.createFooterText(lines.length, 1, capitalize(category), MAX_LINES_PER_PAGE) });

        await interaction.reply({
            embeds: [embed],
            components: [row],
        });

        Pages.handle({
            interaction,
            row,
            embed,
            unique,
            lines,
            itemName: category,
            linesPerPage: MAX_LINES_PER_PAGE,
            idleTime: 10_000,
        });
    } else {
        await interaction.reply({ content: `No wishlist found for ${targetUser.username}` });
    }
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}

function createLines(category: Category, entry: WishlistEntryInternal): string[] {
    const lines = category === 'characters' ? createCharacterLines : createSeriesLines;
    return lines(entry);
}

function createCharacterLines(entry: WishlistEntryInternal): string[] {
    return Array.from(entry.globalIds.values())
        .map(e => {
            const temp: CharacterDescriptionInfo = {
                id: e.globalId,
                images: e.images,
                character: character.query({ globalId: e.globalId }),
            };

            return temp;
        })
        .sort((a, b) => a.id - b.id)
        .map(e => {
            let ids = '';
            if (!wishlist.hasAllImages(e.images)) {
                ids = ` \`[${Array.from(e.images).sort().join('')}]\``;
            }

            let characterInfo: string = MISSING_INFO;
            if (e.character) {
                characterInfo = `${cleanCharacterName(e.character.characterName)}・`
                    + `**${e.character.influence}** <:inf:755213119055200336>`;
            }

            return `\`${e.id}\` ${characterInfo}${ids}`;
        });
}

function createSeriesLines(entry: WishlistEntryInternal): string[] {
    return Array.from(entry.seriesIds)
        .map(id => {
            const temp: SeriesDescriptionInfo = {
                id,
                englishTitle: character.query({ seriesId: id })?.series.englishTitle ?? null,
            };

            return temp;
        })
        .sort((a, b) => a.id - b.id)
        .map(e => {
            const title = e.englishTitle ?? MISSING_INFO;
            return `\`${e.id}\` ${title}`;
        });
}
