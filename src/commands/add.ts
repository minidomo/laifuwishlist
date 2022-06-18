import { SlashCommandBuilder } from '@discordjs/builders';
import {
    CommandInteraction,
    Guild,
    MessageActionRow,
    MessageEmbed,
    Modal,
    ModalSubmitInteraction,
    TextInputComponent,
} from 'discord.js';
import { cleanCharacterName } from 'laifutil';
import { MISSING_INFO } from '../constants';
import { character, wishlist } from '../database';
import type { WishlistCharacterInternal } from '../structures';
import { CustomId } from '../utils';

const seriesModalCustomId = CustomId.createCustomId('add', 'modal-series');
const characterModalCustomId = CustomId.createCustomId('add', 'modal-character');

const seriesCustomId = CustomId.createCustomId('add', 'series');
const characterCustomId = CustomId.createCustomId('add', 'character');
const wishlistTextCustomId = CustomId.createCustomId('add', 'wishlist-text');

const WISHLIST_TEXT_REGEX = /^(\d+)/;
type Category = 'series' | 'characters';

function parseSeries(str: string): number[] {
    return Array.from(str.matchAll(/\d+/g), e => parseInt(e[0]));
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

function seriesDescription(series: number[]): string {
    if (series.length === 0) {
        return 'None';
    }

    let ret = '';

    series.forEach(id => {
        const res = character.query({ seriesId: id });

        let title: string = MISSING_INFO;
        if (res) {
            title = res.series.englishTitle;
        }

        ret += `${title} \`${id}\`\n`;
    });

    return ret;
}

function characterDescription(characters: WishlistCharacterInternal[]): string {
    if (characters.length === 0) {
        return 'None';
    }

    let ret = '';

    characters.forEach(e => {
        const res = character.query({ globalId: e.globalId });

        let name: string = MISSING_INFO;
        if (res) {
            name = cleanCharacterName(res.characterName);
        }

        const ids = Array.from(e.images.values()).sort().join('');
        const all = ids === '123456789';

        let idsText = ` ${ids}`;
        if (all) {
            idsText = '';
        }

        ret += `${name} \`${e.globalId}${idsText}\`\n`;
    });

    return ret;
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
    .setName('add')
    .setDescription('Add characters or series to your wishlist');

export async function execute(interaction: CommandInteraction) {
    const { options } = interaction;

    const category = options.getString('category') as Category;
    const modelCustomId = category === 'characters' ? characterModalCustomId : seriesModalCustomId;

    const modal = new Modal()
        .setTitle('Add to Wishlist')
        .setCustomId(modelCustomId);

    const rows = [];

    if (category === 'characters') {
        const characterInput = new TextInputComponent()
            .setLabel('Global IDs (image numbers are optional)')
            .setCustomId(characterCustomId)
            .setPlaceholder('<gid> <images>\n630 269\n4652')
            .setStyle('PARAGRAPH');

        const wishlistTextInput = new TextInputComponent()
            .setLabel('Wishlist text')
            .setCustomId(wishlistTextCustomId)
            .setPlaceholder('13540 | Anju Emma (アンジュ・エマ)・285inf')
            .setStyle('PARAGRAPH');

        rows.push(
            new MessageActionRow<TextInputComponent>().addComponents(characterInput),
            new MessageActionRow<TextInputComponent>().addComponents(wishlistTextInput),
        );
    } else {
        const seriesInput = new TextInputComponent()
            .setLabel('Series IDs')
            .setCustomId(seriesCustomId)
            .setPlaceholder('351 56')
            .setStyle('PARAGRAPH');

        rows.push(
            new MessageActionRow<TextInputComponent>().addComponents(seriesInput),
        );
    }

    modal.addComponents(...rows);

    await interaction.showModal(modal);
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}

export async function handleModal(interaction: ModalSubmitInteraction) {
    const seriesString = interaction.fields.getTextInputValue(seriesCustomId);
    const charactersString = interaction.fields.getTextInputValue(characterCustomId);
    const wishlistTextString = interaction.fields.getTextInputValue(wishlistTextCustomId);

    const series = parseSeries(seriesString);
    const characters = parseCharacters(charactersString);
    const wishlistCharacters = parseWishlistText(wishlistTextString);
    characters.push(...wishlistCharacters);

    const guild = interaction.guild as Guild;

    series.forEach(seriesId => wishlist.update('add', interaction.user.id, guild.id, seriesId));
    characters.forEach(e => wishlist.update('add', interaction.user.id, guild.id, e));

    const embed = new MessageEmbed()
        .setColor(0x7BF1A8)
        .setTitle('Added to wishlist')
        .addField('Characters', characterDescription(characters))
        .addField('Series', seriesDescription(series));

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}
