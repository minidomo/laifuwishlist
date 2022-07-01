import { SlashCommandBuilder } from '@discordjs/builders';
import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
} from 'discord.js';
import { cleanCharacterName } from 'laifutil';
import { MISSING_INFO } from '../constants';
import { Character, User } from '../model';
import { capitalize, CustomId, Pages, Wishlist } from '../util';

interface CharacterDescriptionInfo {
    id: number;
    images: Set<number>;
    character: BotTypes.LeanCharacterDocument | null;
}

interface SeriesDescriptionInfo {
    id: number;
    title: string | null;
}

type Category = 'series' | 'characters';

const MAX_LINES_PER_PAGE = 20;

export const data = new SlashCommandBuilder()
    .addStringOption(option =>
        option
            .setChoices(
                { name: 'Series', value: 'series' },
                { name: 'Characters', value: 'characters' },
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

    await interaction.deferReply();

    const category = options.getString('category') as Category;
    const targetUser = options.getUser('user') ?? user;

    const entry = await User.findOne({ id: targetUser.id }).lean() as BotTypes.LeanUserDocument | null;

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
        const lines = await createLines(category, entry);

        const embed = new MessageEmbed()
            .setColor(0x28C2FF)
            .setAuthor({
                name: `${targetUser.username}'s Wishlist: ${capitalize(category)}`,
                iconURL: user.avatarURL() ?? user.defaultAvatarURL,
            })
            .setDescription(Pages.createDescription(lines, 1, MAX_LINES_PER_PAGE))
            .setFooter({ text: Pages.createFooterText(lines.length, 1, capitalize(category), MAX_LINES_PER_PAGE) });

        await interaction.editReply({
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
        await interaction.editReply({ content: `No wishlist found for ${targetUser.username}` });
    }
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}

function createLines(category: Category, entry: BotTypes.LeanUserDocument): Promise<string[]> {
    const lines = category === 'characters' ? createCharacterLines : createSeriesLines;
    return lines(entry);
}

async function createCharacterLines(entry: BotTypes.LeanUserDocument): Promise<string[]> {
    const arr = await Promise.all(
        Array.from(Object.keys(entry.globalIds))
            .map(async gid => {
                const imagesStr = entry.globalIds[gid];
                const id = parseInt(gid);

                const character = await Character.findOne({ id })
                    .select('name influence')
                    .lean() as BotTypes.LeanCharacterDocument | null;

                const images: Set<number> = new Set(Array.from(imagesStr, e => parseInt(e)));

                const temp: CharacterDescriptionInfo = {
                    id,
                    images,
                    character,
                };

                return temp;
            }),
    );

    return arr
        .sort((a, b) => a.id - b.id)
        .map(e => {
            let ids = '';
            if (!Wishlist.hasAllImages(e.images)) {
                ids = ` \`[${Array.from(e.images).sort().join('')}]\``;
            }

            let characterInfo: string = MISSING_INFO;
            if (e.character) {
                characterInfo = `${cleanCharacterName(e.character.name)}・`
                    + `**${e.character.influence}** <:inf:755213119055200336>`;
            }

            return `\`${e.id}\` ${characterInfo}${ids}`;
        });
}

async function createSeriesLines(entry: BotTypes.LeanUserDocument): Promise<string[]> {
    const arr = await Promise.all(
        Array.from(Object.keys(entry.seriesIds))
            .map(async sid => {
                const id = parseInt(sid);

                const character = await Character.findOne({ 'series.id': id })
                    .select('series')
                    .lean() as BotTypes.LeanCharacterDocument | null;

                const temp: SeriesDescriptionInfo = {
                    id,
                    title: character?.series.title.english ?? null,
                };

                return temp;
            }),
    );

    return arr
        .sort((a, b) => a.id - b.id)
        .map(e => {
            const title = e.title ?? MISSING_INFO;
            return `\`${e.id}\` ${title}`;
        });
}
