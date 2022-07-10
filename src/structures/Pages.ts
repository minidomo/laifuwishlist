import type { EmbedFooterData } from '@discordjs/builders';
import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    ModalSubmitInteraction,
    TextChannel,
} from 'discord.js';
import { capitalize, CustomId } from '../util';

type ButtonLabel = 'prev' | 'next';

function clamp(lower: number, upper: number, value: number) {
    if (value < lower) {
        return lower;
    } else if (value > upper) {
        return upper;
    } else {
        return value;
    }
}

export class Pages {
    readonly interaction: CommandInteraction | ModalSubmitInteraction;
    readonly unique: BotTypes.Unique;
    readonly lines: string[];
    readonly itemName: string;
    readonly embed: MessageEmbed;
    readonly linesPerPage: number;
    readonly idleTime: number;

    private row: MessageActionRow;
    private currentPage: number;
    private lastPage: number;

    static LINES_PER_PAGE = 20 as const;
    static IDLE_TIME = 10_000 as const;

    constructor(data: BotTypes.PagesOptions) {
        this.interaction = data.interaction;
        this.unique = data.unique;
        this.lines = data.lines;
        this.itemName = data.itemName;
        this.embed = data.embed ?? new MessageEmbed();
        this.linesPerPage = data.linesPerPage ?? Pages.LINES_PER_PAGE;
        this.idleTime = data.idleTime ?? Pages.IDLE_TIME;

        this.row = new MessageActionRow().addComponents(this.createButton('prev'), this.createButton('next'));
        this.currentPage = 1;
        this.lastPage = Math.max(1, Math.ceil(this.lines.length / this.linesPerPage));
    }

    async start(options: BotTypes.PagesStartOptions = {}) {
        if (typeof options.page === 'number') {
            this.currentPage = clamp(1, this.lastPage, options.page);
        }

        this.updateEmbed();

        if (options.deferred) {
            await this.interaction.editReply({
                embeds: [this.embed],
                components: [this.row],
            });
        } else {
            await this.interaction.reply({
                embeds: [this.embed],
                components: [this.row],
                ephemeral: options.ephemeral,
            });
        }

        this.handleEvents();
    }

    private createButton(label: ButtonLabel): MessageButton {
        return new MessageButton()
            .setStyle('PRIMARY')
            .setCustomId(CustomId.createCustomId(this.unique, label))
            .setLabel(capitalize(label));
    }

    private createDescription(): string {
        const lowerIndex = (this.currentPage - 1) * this.linesPerPage;
        const upperIndex = Math.min(this.currentPage * this.linesPerPage - 1, this.lines.length - 1);
        return this.lines.slice(lowerIndex, upperIndex + 1).join('\n');
    }

    private createFooter(): EmbedFooterData {
        return {
            text: `Page ${this.currentPage}/${this.lastPage}・Total ${this.lines.length} ${capitalize(this.itemName)}`,
        } as EmbedFooterData;
    }

    private updateEmbed() {
        this.embed.setDescription(this.createDescription()).setFooter(this.createFooter());
    }

    private updateCurrentPage(action: ButtonLabel) {
        const delta = action === 'next' ? 1 : -1;
        this.currentPage = ((this.currentPage - 1 + delta + this.lastPage) % this.lastPage) + 1;
    }

    private handleEvents() {
        const filterUserId = this.interaction.user.id;
        const filterUnique = this.unique;

        function filter(i: MessageComponentInteraction): boolean {
            return i.user.id === filterUserId && CustomId.getUnique(i.customId) === filterUnique;
        }

        const channel = this.interaction.channel as TextChannel;
        const collector = channel.createMessageComponentCollector({
            componentType: 'BUTTON',
            idle: this.idleTime,
            filter,
        });

        collector.on('collect', async interaction => {
            interaction.deferUpdate();

            const label = CustomId.getId(interaction.customId) as ButtonLabel;
            this.updateCurrentPage(label);
            this.updateEmbed();
            await this.interaction.editReply({ embeds: [this.embed] });
        });

        collector.on('end', async () => {
            this.row.components.forEach(e => e.setDisabled(true));
            await this.interaction.editReply({ components: [this.row] });
        });
    }
}
