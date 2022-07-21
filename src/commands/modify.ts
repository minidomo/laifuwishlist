import { inlineCode, SlashCommandBuilder } from '@discordjs/builders';
import {
    ChatInputCommandInteraction,
    Guild,
    EmbedBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
    ModalBuilder,
} from 'discord.js';
import { cleanCharacterName } from 'laifutil';
import { MISSING_INFO } from '../constants';
import { Pages } from '../structures';
import { createCharacterMap, CustomId, findUser, handleError } from '../util';

type Category = 'series' | 'characters';

interface Args {
    interaction: ChatInputCommandInteraction;
    unique: BotTypes.Unique;
    action: BotTypes.Modification;
    category: Category;
}

interface WishlistCharacter {
    id: number;
    images: string;
}

interface UpdateUserOptions {
    user: BotTypes.UserDocument;
    action: BotTypes.Modification;
    characters?: WishlistCharacter[];
    series?: number[];
}

const CHARACTER_ID_REGEX = /^(\d+)(?: +(\d+))?/;

export const data = new SlashCommandBuilder()
    .addStringOption(option =>
        option
            .setChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' })
            .setName('action')
            .setDescription('Action to take')
            .setRequired(true),
    )
    .addStringOption(option =>
        option
            .setChoices({ name: 'Series', value: 'series' }, { name: 'Characters', value: 'characters' })
            .setName('category')
            .setDescription('The category to display')
            .setRequired(true),
    )
    .setName('modify')
    .setDescription('Add or remove characters or series to your wishlist');

export async function execute(interaction: ChatInputCommandInteraction, unique: BotTypes.Unique) {
    const { options } = interaction;

    const action = options.getString('action') as BotTypes.Modification;
    const category = options.getString('category') as Category;
    const modal = createModalBuilder(unique, action, category);

    await interaction.showModal(modal);

    handleModalBuilder({ interaction, unique, action, category });
}

// eslint-disable-next-line
export function isPermitted(_interaction: ChatInputCommandInteraction): boolean {
    return true;
}

function createActionRowBuilder(unique: BotTypes.Unique, category: Category): ActionRowBuilder<TextInputBuilder> {
    const customId = CustomId.createCustomId(unique, `${category}input`);
    const input = new TextInputBuilder().setStyle(TextInputStyle.Paragraph);

    if (category === 'characters') {
        input
            .setCustomId(customId)
            .setLabel('Global IDs (image numbers are optional)')
            .setPlaceholder('<global_id> <images>\n630 269\n4652\n13540 | Anju Emma (アンジュ・エマ)・285inf');
    } else {
        input.setCustomId(customId).setLabel('Series IDs').setPlaceholder('351\n56');
    }

    return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
}

function createModalBuilder(unique: BotTypes.Unique, action: BotTypes.Modification, category: Category): ModalBuilder {
    const modalCustomId = CustomId.createCustomId(unique, category);

    const title = action === 'add' ? 'Add to wishlist' : 'Remove from wishlist';

    const modal = new ModalBuilder().setTitle(title).setCustomId(modalCustomId);

    modal.addComponents(createActionRowBuilder(unique, category));

    return modal;
}

function handleModalBuilder(args: Args) {
    const { interaction, unique, action, category } = args;

    function filter(i: ModalSubmitInteraction): boolean {
        return i.user.id === interaction.user.id && CustomId.getUnique(i.customId) === unique;
    }

    interaction
        .awaitModalSubmit({ filter, time: 30_000 })
        .then(async i => {
            await i.deferReply();

            const user = await findUser(i.user.id);

            const guild = i.guild as Guild;
            user.guildIds.set(`${guild.id}`, true);

            const input = i.fields.getTextInputValue(CustomId.createCustomId(unique, `${category}input`));
            let lines: string[];

            if (category === 'characters') {
                const characters = parseCharacters(input);
                await updateUser({ user, action, characters });
                lines = await createCharacterLines(characters);
            } else {
                const series = parseSeries(input);
                await updateUser({ user, action, series });
                lines = await createSeriesLines(series);
            }

            const title = action === 'add' ? 'Added to wishlist' : 'Removed from wishlist';
            const color = action === 'add' ? 0x7bf1a8 : 0xff5376;

            const embed = new EmbedBuilder().setColor(color).setTitle(title);

            const pages = new Pages({
                interaction: i,
                unique,
                lines,
                itemName: category,
                embed,
            });

            pages.start({ deferred: true });
        })
        .catch(handleError);
}

function parseSeries(str: string): number[] {
    const arr = Array.from(str.matchAll(/\d+/g), e => parseInt(e[0]));
    return Array.from(new Set(arr)).sort((a, b) => a - b);
}

async function updateUser(options: UpdateUserOptions) {
    const { user, action } = options;

    if (options.characters) {
        options.characters.forEach(e => {
            const id = `${e.id}`;
            const imagesStr = user.globalIds.get(id);
            let newImagesStr = imagesStr ? imagesStr : '';

            if (action === 'add') {
                newImagesStr = uniqueImages(imagesStr + e.images);
            } else if (imagesStr) {
                newImagesStr = Array.from(imagesStr)
                    .filter(v => !e.images.includes(v))
                    .join('');
            }

            if (newImagesStr) {
                user.globalIds.set(id, newImagesStr);
            } else {
                user.globalIds.delete(id);
            }
        });
    } else if (options.series) {
        options.series.forEach(e => {
            const id = `${e}`;
            if (action === 'add') {
                user.seriesIds.set(id, true);
            } else {
                user.seriesIds.delete(id);
            }
        });
    }

    await user.save();
}

function uniqueImages(str: string | undefined): string {
    if (str) {
        const set = new Set(Array.from(str));
        const ret = Array.from(set)
            .filter(e => /[1-9]/.test(e))
            .sort();
        return ret.join('');
    } else {
        return '123456789';
    }
}

function parseCharacters(str: string): WishlistCharacter[] {
    const ret = str
        .split(/[\r\n]+/)
        .filter(line => CHARACTER_ID_REGEX.test(line))
        .map(line => {
            const match = line.match(CHARACTER_ID_REGEX) as RegExpMatchArray;
            return { id: parseInt(match[1]), images: uniqueImages(match[2]) } as WishlistCharacter;
        });

    return ret;
}

async function createSeriesLines(ids: number[]): Promise<string[]> {
    const characterMap = await createCharacterMap(ids, 'series', 'series.title.english');
    const ret = ids.map(id => {
        const res = characterMap.get(id);
        const title = res?.series.title.english ?? MISSING_INFO;
        return `${inlineCode(`${id}`)} ${title}`;
    });

    return ret;
}

async function createCharacterLines(characters: WishlistCharacter[]): Promise<string[]> {
    const ids = characters.map(e => e.id);
    const characterMap = await createCharacterMap(ids, 'global', 'name');
    const ret = characters.map(e => {
        const res = characterMap.get(e.id);
        const name = res ? cleanCharacterName(res.name) : MISSING_INFO;
        const wantedIds = e.images.length === 9 ? '' : ` ${e.images}`;

        return `${inlineCode(`${e.id}${wantedIds}`)} ${name}`;
    });

    return ret;
}
