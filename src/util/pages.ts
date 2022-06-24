import type {
    CommandInteraction,
    MessageActionRow,
    MessageComponentInteraction,
    MessageEmbed,
    ModalSubmitInteraction,
    TextChannel,
} from 'discord.js';
import type { Bounds } from 'laifutil';
import { CustomId, capitalize } from '.';

export function nextPage(page: number, lastPage: number): number {
    return ((page - 1) + 1 + lastPage) % lastPage + 1;
}

export function previousPage(page: number, lastPage: number): number {
    return ((page - 1) - 1 + lastPage) % lastPage + 1;
}

export function calculateLastPage(lines: number, linesPerPage: number): number {
    if (lines === 0) {
        return 1;
    }

    return Math.ceil(lines / linesPerPage);
}

export function calculateBounds(page: number, lines: number, linesPerPage: number): Bounds {
    return {
        lower: (page - 1) * linesPerPage,
        upper: Math.min(page * linesPerPage - 1, lines - 1),
    };
}

export function clamp(page: number, lastPage: number): number {
    if (page < 1) {
        return 1;
    } else if (page > lastPage) {
        return lastPage;
    } else {
        return page;
    }
}

interface PagesHandleArgs {
    interaction: CommandInteraction | ModalSubmitInteraction;
    row: MessageActionRow;
    embed: MessageEmbed;
    unique: string;
    itemName: string;
    lines: string[];
    linesPerPage: number;
    idleTime: number;
}

type ButtonLabel = 'prev' | 'next';

export function createDescription(lines: string[], page: number, linesPerPage: number) {
    const lastPage = calculateLastPage(lines.length, linesPerPage);
    const targetPage = clamp(page, lastPage);
    const bounds = calculateBounds(targetPage, lines.length, linesPerPage);
    return lines.slice(bounds.lower, bounds.upper + 1).join('\n');
}

export function createFooterText(lines: number, page: number, itemName: string, linesPerPage: number): string {
    const lastPage = calculateLastPage(lines, linesPerPage);
    const targetPage = clamp(page, lastPage);
    return `Page ${targetPage}/${lastPage}・Total ${lines} ${capitalize(itemName)}`;
}

export function handle(args: PagesHandleArgs) {
    const { interaction, row, itemName, lines, embed, unique, linesPerPage, idleTime } = args;

    const lastPage = calculateLastPage(lines.length, linesPerPage);

    function filter(i: MessageComponentInteraction): boolean {
        return i.user.id === interaction.user.id && CustomId.getUnique(i.customId) === unique;
    }

    const channel = interaction.channel as TextChannel;
    const collector = channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        idle: idleTime,
        filter,
    });

    let curPage = 1;
    collector.on('collect', async i => {
        i.deferUpdate();

        const label = CustomId.getId(i.customId) as ButtonLabel;

        if (label === 'next') {
            curPage = nextPage(curPage, lastPage);
        } else {
            curPage = previousPage(curPage, lastPage);
        }

        embed
            .setDescription(createDescription(lines, curPage, linesPerPage))
            .setFooter({ text: createFooterText(lines.length, curPage, capitalize(itemName), linesPerPage) });

        await interaction.editReply({ embeds: [embed] });
    });

    collector.on('end', async () => {
        row.components.forEach(e => e.setDisabled(true));
        await interaction.editReply({ components: [row] });
    });
}
