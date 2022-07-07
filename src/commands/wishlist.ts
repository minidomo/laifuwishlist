import { bold, inlineCode, SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { cleanCharacterName } from 'laifutil';
import { MISSING_INFO } from '../constants';
import { Character, User } from '../model';
import { Pages } from '../structures';
import { capitalize } from '../util';

interface CharacterInfo {
    id: number;
    images: string;
    character: BotTypes.LeanCharacterDocument | null;
}

interface SeriesInfo {
    id: number;
    title: string | null;
}

type Category = 'series' | 'characters';

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

export async function execute(interaction: CommandInteraction, unique: BotTypes.Unique) {
    await interaction.deferReply();

    const { options, user } = interaction;

    const category = options.getString('category') as Category;
    const targetUser = options.getUser('user') ?? user;

    const userDoc = await User.findOne({ id: targetUser.id }).lean() as BotTypes.LeanUserDocument | null;

    if (userDoc) {
        const lines = await createLines(category, userDoc);

        const embed = new MessageEmbed()
            .setColor(0x28C2FF)
            .setAuthor({
                name: `${targetUser.username}'s Wishlist: ${capitalize(category)}`,
                iconURL: user.avatarURL() ?? user.defaultAvatarURL,
            });

        const pages = new Pages({
            interaction,
            unique,
            lines,
            itemName: category,
            embed,
        });

        pages.start({ deferred: true });
    } else {
        await interaction.editReply({ content: `No wishlist found for ${targetUser.username}` });
    }
}

// eslint-disable-next-line
export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}

function createLines(category: Category, user: BotTypes.LeanUserDocument): Promise<string[]> {
    const lines = category === 'characters' ? createCharacterLines : createSeriesLines;
    return lines(user);
}

async function createCharacterLines(user: BotTypes.LeanUserDocument): Promise<string[]> {
    const promises = Array.from(Object.keys(user.globalIds))
        .map(async gid => {
            const images = user.globalIds[gid];

            const id = parseInt(gid);
            const character = await Character.findOne({ id })
                .select('name influence')
                .lean() as BotTypes.LeanCharacterDocument | null;

            return { id, images, character } as CharacterInfo;
        });

    const arr = await Promise.all(promises);
    const ret = arr
        .sort((a, b) => a.id - b.id)
        .map(e => {
            const ids = e.images.length === 9 ? '' : ` ${e.images}`;
            let characterInfo: string = MISSING_INFO;

            if (e.character) {
                characterInfo = `${cleanCharacterName(e.character.name)}・`
                    + `${bold(`${e.character.influence}`)} <:inf:755213119055200336>`;
            }

            return `${inlineCode(`${e.id}${ids}`)} ${characterInfo}`;
        });

    return ret;
}

async function createSeriesLines(user: BotTypes.LeanUserDocument): Promise<string[]> {
    const promises = Array.from(Object.keys(user.seriesIds))
        .map(async sid => {
            const id = parseInt(sid);

            const character = await Character.findOne({ 'series.id': id })
                .select('series')
                .lean() as BotTypes.LeanCharacterDocument | null;

            return {
                id,
                title: character?.series.title.english ?? null,
            } as SeriesInfo;
        });

    const arr = await Promise.all(promises);
    const ret = arr
        .sort((a, b) => a.id - b.id)
        .map(e => {
            const title = e.title ?? MISSING_INFO;
            return `${inlineCode(`${e.id}`)} ${title}`;
        });

    return ret;
}
