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
import { character, wishlist } from '../database';
import type { Action, WishlistCharacterInternal } from '../structures';
import { capitalize, CustomId, Pages } from '../util';

interface CustomIdArgs {
    character?: string;
    wishlistText?: string;
    series?: string;
}

interface Args {
    interaction: CommandInteraction;
    unique: string;
    customId: CustomIdArgs;
    action: Action;
}

type Category = 'series' | 'characters';

const WISHLIST_TEXT_REGEX = /^(\d+)/;
const MAX_LINES_PER_PAGE = 20;

export const data = new SlashCommandBuilder()
    .addStringOption(option =>
        option
            .setChoices(
                {
                    name: 'Add',
                    value: 'add',
                },
                {
                    name: 'Remove',
                    value: 'remove',
                },
            )
            .setName('action')
            .setDescription('Action to take')
            .setRequired(true))
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
    .setName('modify')
    .setDescription('Add or remove characters or series to your wishlist');

export async function execute(interaction: CommandInteraction) {
    const { options } = interaction;
    const unique = CustomId.createUnique();

    const action = options.getString('action') as Action;
    const category = options.getString('category') as Category;

    const modalCustomId = CustomId.createCustomId(unique, category);
    const customId: CustomIdArgs = {};

    const modal = new Modal()
        .setTitle('Add to Wishlist')
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
        .then(i => {
            const category = CustomId.getId(i.customId) as Category;

            let lines: string[];
            if (category === 'characters') {
                const characterString = i.fields.getTextInputValue(customId.character as string);
                const wishlistTextString = i.fields.getTextInputValue(customId.wishlistText as string);

                const characters = merge(parseCharacters(characterString), parseWishlistText(wishlistTextString));

                const guild = i.guild as Guild;
                characters.forEach(e => wishlist.update(action, i.user.id, guild.id, e));

                lines = createCharacterLines(characters);
            } else {
                const seriesString = i.fields.getTextInputValue(customId.series as string);

                const series = parseSeries(seriesString);

                const guild = i.guild as Guild;
                series.forEach(e => wishlist.update(action, i.user.id, guild.id, e));

                lines = createSeriesLines(series);
            }

            const prevButton = new MessageButton()
                .setStyle('PRIMARY')
                .setCustomId(CustomId.createCustomId(unique, 'prev'))
                .setLabel('Prev');

            const nextButton = new MessageButton()
                .setStyle('PRIMARY')
                .setCustomId(CustomId.createCustomId(unique, 'next'))
                .setLabel('Next');

            const row = new MessageActionRow().addComponents(prevButton, nextButton);

            const embed = new MessageEmbed()
                .setColor(0x7BF1A8)
                .setTitle('Added to wishlist')
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
        .catch(() => 0);
}

function parseSeries(str: string): number[] {
    const arr = Array.from(str.matchAll(/\d+/g), e => parseInt(e[0]));
    return Array.from(new Set(arr)).sort((a, b) => a - b);
}

function parseCharacters(str: string): WishlistCharacterInternal[] {
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

            const obj: WishlistCharacterInternal = {
                globalId: parseInt(parts[0]),
                images,
            };
            return obj;
        });
}

function parseWishlistText(str: string): WishlistCharacterInternal[] {
    return str.split(/[\r\n]+/)
        .filter(line => WISHLIST_TEXT_REGEX.test(line))
        .map(line => {
            const match = line.match(WISHLIST_TEXT_REGEX) as RegExpMatchArray;
            const globalId = parseInt(match[1]);
            const images: Set<number> = new Set();

            for (let i = 1; i <= 9; i++) {
                images.add(i);
            }

            const obj: WishlistCharacterInternal = {
                globalId,
                images,
            };
            return obj;
        });
}

function createSeriesLines(ids: number[]): string[] {
    return ids.map(id => {
        const res = character.query({ seriesId: id });

        let title: string = MISSING_INFO;
        if (res) {
            title = res.series.englishTitle;
        }

        return `\`${id}\` ${title}`;
    });
}

function createCharacterLines(characters: WishlistCharacterInternal[]): string[] {
    return characters.map(e => {
        const res = character.query({ globalId: e.globalId });

        let name: string = MISSING_INFO;
        if (res) {
            name = cleanCharacterName(res.characterName);
        }

        let ids = '';
        if (!wishlist.hasAllImages(e.images)) {
            ids = ` \`[${Array.from(e.images).sort().join('')}]\``;
        }

        return `\`${e.globalId}\` ${name}${ids}`;
    });
}

function merge(...arr: WishlistCharacterInternal[][]): WishlistCharacterInternal[] {
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
            const temp: WishlistCharacterInternal = {
                globalId: id,
                images: map.get(id) as Set<number>,
            };

            return temp;
        })
        .sort((a, b) => a.globalId - b.globalId);
}
