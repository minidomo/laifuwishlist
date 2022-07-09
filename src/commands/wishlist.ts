import { bold, inlineCode, SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { cleanCharacterName } from 'laifutil';
import { INFLUENCE_EMOJI, MISSING_INFO } from '../constants';
import { User } from '../model';
import { Pages } from '../structures';
import { capitalize, createCharacterMap } from '../util';

interface CharacterInfo {
    id: number;
    images: string;
    character?: BotTypes.LeanCharacterDocument;
}

interface SeriesInfo {
    id: number;
    title?: string;
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
    .addIntegerOption(option =>
        option
            .setName('page')
            .setDescription('The page to start on'))
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('See a user\'s wishlist. Defaults to own wishlist.'))
    .setName('wishlist')
    .setDescription('Shows a user\'s wishlist');

export async function execute(interaction: CommandInteraction, unique: BotTypes.Unique) {
    await interaction.deferReply();

    const { options, user } = interaction;

    const pageNumber = options.getInteger('page') ?? undefined;
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

        pages.start({ deferred: true, page: pageNumber });
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
    const ids = Array.from(Object.keys(user.globalIds)).map(id => parseInt(id));
    const characterMap = await createCharacterMap(ids, 'global', 'name influence');
    const arr = ids.map(id => ({
            id,
            images: user.globalIds[id],
            character: characterMap.get(id),
        } as CharacterInfo));

    const ret = arr
        .sort((a, b) => a.id - b.id)
        .map(e => {
            const wantedIds = e.images.length === 9 ? '' : ` ${e.images}`;
            let characterInfo: string = MISSING_INFO;

            if (e.character) {
                characterInfo = `${cleanCharacterName(e.character.name)}・`
                    + `${bold(`${e.character.influence}`)} ${INFLUENCE_EMOJI}`;
            }

            return `${inlineCode(`${e.id}${wantedIds}`)} ${characterInfo}`;
        });

    return ret;
}

async function createSeriesLines(user: BotTypes.LeanUserDocument): Promise<string[]> {
    const ids = Array.from(Object.keys(user.seriesIds)).map(id => parseInt(id));
    const characterMap = await createCharacterMap(ids, 'series', 'series.title.english');
    const arr = ids.map(id => ({
            id,
            title: characterMap.get(id)?.series.title.english,
        } as SeriesInfo));

    const ret = arr
        .sort((a, b) => a.id - b.id)
        .map(e => {
            const title = e.title ?? MISSING_INFO;
            return `${inlineCode(`${e.id}`)} ${title}`;
        });

    return ret;
}
