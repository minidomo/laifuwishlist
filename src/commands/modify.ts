import { SlashCommandBuilder } from '@discordjs/builders';
import {
    CommandInteraction,
    Guild,
    MessageActionRow,
    MessageEmbed,
    Modal,
    ModalSubmitInteraction,
    TextInputComponent,
    MessageButton,
} from 'discord.js';
import { cleanCharacterName } from 'laifutil';
import { MISSING_INFO } from '../constants';
import { Character, User } from '../model';
import { capitalize, CustomId, Pages, Wishlist } from '../util';

interface CustomIdArgs {
    character?: string;
    wishlistText?: string;
    series?: string;
}

interface Args {
    interaction: CommandInteraction;
    unique: string;
    customId: CustomIdArgs;
    action: BotTypes.Modification;
}

type Category = 'series' | 'characters';

const WISHLIST_TEXT_REGEX = /^(\d+)/;
const MAX_LINES_PER_PAGE = 20;

export const data = new SlashCommandBuilder()
    .addStringOption(option =>
        option
            .setChoices(
                { name: 'Add', value: 'add' },
                { name: 'Remove', value: 'remove' },
            )
            .setName('action')
            .setDescription('Action to take')
            .setRequired(true))
    .addStringOption(option =>
        option
            .setChoices(
                { name: 'Series', value: 'series' },
                { name: 'Characters', value: 'characters' },
            )
            .setName('category')
            .setDescription('The category to display')
            .setRequired(true))
    .setName('modify')
    .setDescription('Add or remove characters or series to your wishlist');

export async function execute(interaction: CommandInteraction) {
    const { options } = interaction;
    const unique = CustomId.createUnique();

    const action = options.getString('action') as BotTypes.Modification;
    const category = options.getString('category') as Category;

    const modalCustomId = CustomId.createCustomId(unique, category);
    const customId: CustomIdArgs = {};

    const title = action === 'add' ? 'Add to wishlist' : 'Remove from wishlist';

    const modal = new Modal()
        .setTitle(title)
        .setCustomId(modalCustomId);

    const rows = [];

    if (category === 'characters') {
        customId.character = CustomId.createCustomId(unique, 'character');
        customId.wishlistText = CustomId.createCustomId(unique, 'wishlist-text');

        const characterInput = new TextInputComponent()
            .setLabel('Global IDs (image numbers are optional)')
            .setCustomId(customId.character)
            .setPlaceholder('<gid> <images>\n630 269\n4652')
            .setStyle('PARAGRAPH');

        const wishlistTextInput = new TextInputComponent()
            .setLabel('Wishlist text')
            .setCustomId(customId.wishlistText)
            .setPlaceholder('13540 | Anju Emma (アンジュ・エマ)・285inf')
            .setStyle('PARAGRAPH');

        rows.push(
            new MessageActionRow<TextInputComponent>().addComponents(characterInput),
            new MessageActionRow<TextInputComponent>().addComponents(wishlistTextInput),
        );
    } else {
        customId.series = CustomId.createCustomId(unique, 'series');

        const seriesInput = new TextInputComponent()
            .setLabel('Series IDs')
            .setCustomId(customId.series)
            .setPlaceholder('351 56')
            .setStyle('PARAGRAPH');

        rows.push(
            new MessageActionRow<TextInputComponent>().addComponents(seriesInput),
        );
    }

    modal.addComponents(...rows);

    await interaction.showModal(modal);

    handleModal({ interaction, unique, customId, action });
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}

function handleModal(args: Args) {
    const { interaction, unique, customId, action } = args;

    function filter(i: ModalSubmitInteraction): boolean {
        return i.user.id === interaction.user.id && CustomId.getUnique(i.customId) === unique;
    }

    interaction.awaitModalSubmit({ filter, time: 30_000 })
        .then(async i => {
            const userTemp = await User.findOne({ id: i.user.id });
            let user: BotTypes.UserDocument;

            if (userTemp) {
                user = userTemp as BotTypes.UserDocument;
            } else {
                const schema: BotTypes.UserSchema = {
                    id: i.user.id,
                    seriesIds: {} as Map<string, boolean>,
                    guildIds: {} as Map<string, boolean>,
                    globalIds: {} as Map<string, string>,
                };

                user = new User(schema) as BotTypes.UserDocument;
            }

            const guild = i.guild as Guild;
            user.guildIds.set(`${guild.id}`, true);

            const category = CustomId.getId(i.customId) as Category;

            let lines: string[];
            if (category === 'characters') {
                const characterString = i.fields.getTextInputValue(customId.character as string);
                const wishlistTextString = i.fields.getTextInputValue(customId.wishlistText as string);

                const characters = merge(parseCharacters(characterString), parseWishlistText(wishlistTextString));

                characters.forEach(e => {
                    const id = `${e.globalId}`;
                    const imagesStr = user.globalIds.get(id);
                    let newImagesStr = imagesStr ? imagesStr : '';

                    if (action === 'add') {
                        e.images.forEach(v => {
                            if (!newImagesStr.includes(`${v}`)) {
                                newImagesStr += v;
                            }
                        });
                    } else if (imagesStr) {
                        const arr = Array.from(imagesStr, v => parseInt(v));
                        newImagesStr = arr.filter(v => !e.images.has(v)).join('');
                    }

                    if (newImagesStr) {
                        user.globalIds.set(id, newImagesStr);
                    } else {
                        user.globalIds.delete(id);
                    }
                });

                lines = await createCharacterLines(characters);
            } else {
                const seriesString = i.fields.getTextInputValue(customId.series as string);

                const series = parseSeries(seriesString);

                series.forEach(e => {
                    const id = `${e}`;

                    if (action === 'add') {
                        user.seriesIds.set(id, true);
                    } else {
                        user.seriesIds.delete(id);
                    }
                });

                lines = await createSeriesLines(series);
            }

            await user.save();

            const prevButton = new MessageButton()
                .setStyle('PRIMARY')
                .setCustomId(CustomId.createCustomId(unique, 'prev'))
                .setLabel('Prev');

            const nextButton = new MessageButton()
                .setStyle('PRIMARY')
                .setCustomId(CustomId.createCustomId(unique, 'next'))
                .setLabel('Next');

            const row = new MessageActionRow().addComponents(prevButton, nextButton);
            const title = action === 'add' ? 'Added to wishlist' : 'Removed from wishlist';
            const color = action === 'add' ? 0x7BF1A8 : 0xFF5376;

            const embed = new MessageEmbed()
                .setColor(color)
                .setTitle(title)
                .setDescription(Pages.createDescription(lines, 1, MAX_LINES_PER_PAGE))
                .setFooter({ text: Pages.createFooterText(lines.length, 1, capitalize(category), MAX_LINES_PER_PAGE) });

            i.reply({ embeds: [embed], components: [row], ephemeral: true });

            Pages.handle({
                interaction: i,
                row,
                embed,
                unique,
                lines,
                itemName: category,
                linesPerPage: MAX_LINES_PER_PAGE,
                idleTime: 10_000,
            });
        })
        .catch((console.error));
}

function parseSeries(str: string): number[] {
    const arr = Array.from(str.matchAll(/\d+/g), e => parseInt(e[0]));
    return Array.from(new Set(arr)).sort((a, b) => a - b);
}

function parseCharacters(str: string): BotTypes.WishlistCharacter[] {
    return str.split(/[\r\n]+/)
        .map(line =>
            line
                .split(/\s+/)
                .filter(e => /\d+/.test(e)))
        .filter(parts => parts.length > 0 && parts.length <= 2)
        .map(parts => {
            const images: Set<number> = new Set();
            if (parts[1]) {
                for (const e of parts[1]) {
                    if (e !== '0') {
                        images.add(parseInt(e));
                    }
                }
            } else {
                for (let i = 1; i <= 9; i++) {
                    images.add(i);
                }
            }

            const obj: BotTypes.WishlistCharacter = {
                globalId: parseInt(parts[0]),
                images,
            };
            return obj;
        });
}

function parseWishlistText(str: string): BotTypes.WishlistCharacter[] {
    return str.split(/[\r\n]+/)
        .filter(line => WISHLIST_TEXT_REGEX.test(line))
        .map(line => {
            const match = line.match(WISHLIST_TEXT_REGEX) as RegExpMatchArray;
            const globalId = parseInt(match[1]);
            const images: Set<number> = new Set();

            for (let i = 1; i <= 9; i++) {
                images.add(i);
            }

            const obj: BotTypes.WishlistCharacter = {
                globalId,
                images,
            };
            return obj;
        });
}

function createSeriesLines(ids: number[]): Promise<string[]> {
    return Promise.all(
        ids.map(async id => {
            const res = await Character.findOne({ 'series.id': id })
                .select('series')
                .lean() as BotTypes.LeanCharacterDocument | null;

            let title: string = MISSING_INFO;
            if (res) {
                title = res.series.title.english;
            }

            return `\`${id}\` ${title}`;
        }),
    );
}

function createCharacterLines(characters: BotTypes.WishlistCharacter[]): Promise<string[]> {
    return Promise.all(
        characters.map(async e => {
            const res = await Character.findOne({ id: e.globalId })
                .select('name')
                .lean() as BotTypes.LeanCharacterDocument | null;

            let name: string = MISSING_INFO;
            if (res) {
                name = cleanCharacterName(res.name);
            }

            let ids = '';
            if (!Wishlist.hasAllImages(e.images)) {
                ids = ` \`[${Array.from(e.images).sort().join('')}]\``;
            }

            return `\`${e.globalId}\` ${name}${ids}`;
        }),
    );
}

function merge(...arr: BotTypes.WishlistCharacter[][]): BotTypes.WishlistCharacter[] {
    const map: Map<number, Set<number>> = new Map();

    arr.forEach(characters => {
        characters.forEach(e => {
            const images = map.get(e.globalId);
            if (images) {
                e.images.forEach(num => images.add(num));
            } else {
                map.set(e.globalId, new Set(e.images));
            }
        });
    });

    return Array.from(map.keys())
        .map(id => {
            const temp: BotTypes.WishlistCharacter = {
                globalId: id,
                images: map.get(id) as Set<number>,
            };

            return temp;
        })
        .sort((a, b) => a.globalId - b.globalId);
}
