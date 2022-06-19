import { SlashCommandBuilder, time } from '@discordjs/builders';
import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    TextBasedChannel,
} from 'discord.js';
import { ownerClientId } from '../config';
import { character, wishlist } from '../database';
import type { BackupMetadata, CharacterDatabase, DatabaseType, WishlistDatabase } from '../structures';
import { capitalize, CustomId } from '../utils';

interface Args {
    interaction: CommandInteraction;
    embed: MessageEmbed;
    backups: BackupMetadata[];
    row: MessageActionRow;
    unique: string;
}

const MAX_RESPONSE_TIME = 5000;

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
    const unique = CustomId.createUnique();

    const databaseType = options.getString('database') as DatabaseType;
    let database: WishlistDatabase | CharacterDatabase;

    if (databaseType === 'character') {
        database = character;
    } else {
        database = wishlist;
    }

    const backups = database.getBackups();

    const embed = new MessageEmbed()
        .setColor(0xFFEF9F)
        .setTitle(`Available Backups: ${capitalize(databaseType)}`);

    if (backups.length > 0) {
        embed.setDescription(createDescription(backups));

        const buttons = createButtons(unique, backups.length);
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
            row,
            unique,
        });
    } else {
        embed.setDescription('No backups available.');

        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }
}

export function isPermitted(interaction: CommandInteraction): boolean {
    const { user } = interaction;
    return user.id === ownerClientId;
}

function handleButtons(args: Args) {
    const { interaction, backups, embed, row, unique } = args;

    function filter(i: MessageComponentInteraction): boolean {
        return i.user.id === interaction.user.id && CustomId.getUnique(i.customId) === unique;
    }

    row.components.forEach(e => e.setDisabled(true));

    const channel = interaction.channel as TextBasedChannel;
    const collector = channel.createMessageComponentCollector({
        filter,
        time: MAX_RESPONSE_TIME,
        componentType: 'BUTTON',
        max: 1,
    });

    collector.on('collect', async i => {
        i.deferUpdate();

        const label = CustomId.getId(i.customId);
        const index = parseInt(label) - 1;

        const success = await character.importData(backups[index]);

        let content = '';

        if (success) {
            content = `\n\nSuccessfully switched the database to \`${label}\``;
        } else {
            content = `\n\nFailed to switch the database to \`${label}\``;
        }

        embed.setDescription(embed.description + content);

        await interaction.editReply({ embeds: [embed] });
    });

    collector.on('end', async () => {
        await interaction.editReply({ components: [row] });
    });
}

function createDescription(backups: BackupMetadata[]): string {
    let ret = 'Select a backup to import\n\n';

    ret += backups
        .map((e, index) => `\`${index + 1}\` ${time(e.dateCreated)}`)
        .join('\n');

    return ret;
}

function createButtons(unique: string, count: number): MessageButton[] {
    const arr: MessageButton[] = [];

    for (let i = 1; i <= count; i++) {
        arr.push(new MessageButton()
            .setCustomId(CustomId.createCustomId(unique, `${i}`))
            .setLabel(`${i}`)
            .setStyle('PRIMARY'));
    }

    return arr;
}
