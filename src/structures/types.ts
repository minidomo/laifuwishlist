import type { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction, ModalSubmitInteraction } from 'discord.js';

export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
    handleModal?: (interaction: ModalSubmitInteraction) => Promise<void>;
}

export interface CommandContainer {
    [key: string]: Command;
}

export interface BackupMetadata {
    filename: string;
    dateCreated: number;
}

