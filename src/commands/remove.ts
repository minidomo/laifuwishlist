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
import { character, wishlist } from '../database';
import type { WishlistCharacterInternal } from '../structures';
import { CustomId } from '../utils';

const seriesCustomId = CustomId.createCustomId('remove', 'series');
const characterCustomId = CustomId.createCustomId('remove', 'character');

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

function seriesDescription(series: number[]): string {
    if (series.length === 0) {
        return 'None';
    }

    let ret = '';

    series.forEach(id => {
        const res = character.query({ seriesId: id });

        let title = '*MISSING INFO*';
        if (res) {
            title = res.series.englishTitle;
        }

        ret += `${title} \`[${id}]\`\n`;
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

        let name = '*MISSING INFO*';
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
    .setName('remove')
    .setDescription('Remove characters or series from your wishlist');

export async function execute(interaction: CommandInteraction) {
    const modal = new Modal()
        .setTitle('Remove from Wishlist')
        .setCustomId(CustomId.createCustomId('remove', 'modal'));

    const seriesInput = new TextInputComponent()
        .setLabel('Series IDs')
        .setCustomId(seriesCustomId)
        .setPlaceholder('351 56')
        .setStyle('SHORT');

    const characterInput = new TextInputComponent()
        .setLabel('Global IDs and image numbers (optional)')
        .setCustomId(characterCustomId)
        .setPlaceholder('<gid> <images>\n630 269\n4652')
        .setStyle('PARAGRAPH');

    const firstRow = new MessageActionRow<TextInputComponent>().addComponents(seriesInput);
    const secondRow = new MessageActionRow<TextInputComponent>().addComponents(characterInput);

    modal.addComponents(firstRow, secondRow);

    await interaction.showModal(modal);
}

export function isPermitted(_interaction: CommandInteraction): boolean {
    return true;
}

export async function handleModal(interaction: ModalSubmitInteraction) {
    const seriesString = interaction.fields.getTextInputValue(seriesCustomId);
    const charactersString = interaction.fields.getTextInputValue(characterCustomId);

    const series = parseSeries(seriesString);
    const characters = parseCharacters(charactersString);

    const guild = interaction.guild as Guild;

    series.forEach(seriesId => wishlist.update('remove', interaction.user.id, guild.id, seriesId));
    characters.forEach(e => wishlist.update('remove', interaction.user.id, guild.id, e));

    const embed = new MessageEmbed()
        .setColor(0xFF5376)
        .setTitle('Removed from wishlist')
        .addField('Characters', characterDescription(characters))
        .addField('Series', seriesDescription(series));

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}
