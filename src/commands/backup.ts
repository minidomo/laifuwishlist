import { SlashCommandBuilder, time } from '@discordjs/builders';
import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    TextBasedChannel,
} from 'discord.js';
import { character, wishlist } from '../database';
import { logger } from '../logger';
import type { CharacterDatabase, DatabaseType, WishlistDatabase } from '../structures';
import type { BackupMetadata } from '../types';
import { getLabel } from '../util';

const maxResponseTime = 5000;

function generateDescription(backups: BackupMetadata[]): string {
    let ret = 'Select a backup to import\n\n';

    ret += backups
        .map((e, index) => `\`${index + 1}\` ${time(e.dateCreated)}`)
        .join('\n');

    return ret;
}

function generateButtons(count: number): MessageButton[] {
    const arr: MessageButton[] = [];

    for (let i = 1; i <= count; i++) {
        arr.push(new MessageButton()
            .setCustomId(`backup-${i}`)
            .setLabel(`${i}`)
            .setStyle('PRIMARY'));
    }

    return arr;
}

export const data = new SlashCommandBuilder()
    .addStringOption(option =>
        option
            .setChoices(
                {
                    name: 'Wishlist',
                    value: 'wishlist',
                },
                {
                    name: 'Character',
                    value: 'character',
                },
            )
            .setName('database')
            .setDescription('The type of database')
            .setRequired(true))
    .setName('backup')
    .setDescription('Switch the database to a backup');

export async function execute(interaction: CommandInteraction) {
    const { options } = interaction;

    const databaseType = options.getString('database') as DatabaseType;
    let database: WishlistDatabase | CharacterDatabase;

    if (databaseType === 'character') {
        database = character;
    } else {
        database = wishlist;
    }

    const backups = database.getBackups();

    const embed = new MessageEmbed()
        .setTitle(`Available Backups: ${databaseType[0].toUpperCase()}${databaseType.substring(1)}`);

    if (backups.length > 0) {
        embed.setDescription(generateDescription(backups));

        const buttons = generateButtons(backups.length);
        const row = new MessageActionRow().addComponents(buttons);

        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
            components: [row],
        });

        handleButtons({
            interaction,
            backups,
            embed,
        });
    } else {
        embed.setDescription('No backups available.');

        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }
}

interface Args {
    interaction: CommandInteraction;
    embed: MessageEmbed;
    backups: BackupMetadata[];
}

function handleButtons(args: Args) {
    const { interaction, backups, embed } = args;

    function filter(i: MessageComponentInteraction): boolean {
        i.deferUpdate();
        return i.user.id === interaction.user.id && i.customId.startsWith('backup');
    }

    const channel = interaction.channel as TextBasedChannel;

    channel.awaitMessageComponent({ filter, time: maxResponseTime, componentType: 'BUTTON' })
        .then(async i => {
            const label = getLabel(i.customId);
            const index = parseInt(label) - 1;

            const success = await character.importData(backups[index]);

            let content = '';

            if (success) {
                content = `Successfully switched the database to \`${label}\``;
            } else {
                content = `Failed to switch the database to \`${label}\``;
            }

            embed.setDescription(`${embed.description}\n\n${content}`);

            await i.update({
                embeds: [embed],
                components: [],
            });
        })
        .catch(logger.error);
}
