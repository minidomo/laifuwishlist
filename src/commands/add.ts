import { SlashCommandBuilder } from '@discordjs/builders';
import {
    CommandInteraction,
    MessageActionRow,
    Modal,
    TextInputComponent,
} from 'discord.js';
import { CustomId } from '../utils';

export const data = new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add characters or series to your wishlist');

export async function execute(interaction: CommandInteraction) {
    const modal = new Modal()
        .setTitle('Add to Wishlist')
        .setCustomId(CustomId.createCustomId('add', 'modal'));

    const seriesInput = new TextInputComponent()
        .setLabel('Series IDs')
        .setCustomId(CustomId.createCustomId('add', 'series'))
        .setPlaceholder('351 56')
        .setStyle('SHORT');

    const characterInput = new TextInputComponent()
        .setLabel('Global IDs and image numbers (optional)')
        .setCustomId(CustomId.createCustomId('add', 'character'))
        .setPlaceholder('<gid> <images>\n630 269\n4652')
        .setStyle('PARAGRAPH');

    const firstRow = new MessageActionRow<TextInputComponent>().addComponents(seriesInput);
    const secondRow = new MessageActionRow<TextInputComponent>().addComponents(characterInput);

    modal.addComponents(firstRow, secondRow);

    await interaction.showModal(modal);
}

