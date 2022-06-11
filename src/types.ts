import type { SlashCommandBuilder } from '@discordjs/builders';
import type { CommandInteraction } from 'discord.js';

export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
}

export interface CommandContainer {
    [key: string]: Command;
}
