import { SlashCommandBuilder, time } from '@discordjs/builders';
import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    TextBasedChannel,
} from 'discord.js';
import * as CharacterDatabase from '../CharacterDatabase';
import { getLabel } from '../util';

function generateDescription(backups: CharacterDatabase.BackupMetadata[]): string {
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
    .setName('backup')
    .setDescription('Switch the database to a backup');

export async function execute(interaction: CommandInteraction) {
    const backups = CharacterDatabase.getBackups();

    const embed = new MessageEmbed()
        .setTitle('Available Backups')
        .setColor('BLURPLE');

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
    embed: MessageEmbed,
    backups: CharacterDatabase.BackupMetadata[],
}

function handleButtons(args: Args) {
    const { interaction, backups, embed } = args;

    const filter = (i: MessageComponentInteraction) =>
        i.user.id === interaction.user.id && i.customId.startsWith('backup');
    const channel = interaction.channel as TextBasedChannel;
    const collector = channel.createMessageComponentCollector({ filter, time: 5000 });

    collector.on('collect', async i => {
        const label = getLabel(i.customId);
        const index = parseInt(label) - 1;
        const backup = backups[index];

        const success = await CharacterDatabase.importData(backup.filename);

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
    });
}
