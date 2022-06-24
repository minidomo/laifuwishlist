import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

declare global {
    namespace BotTypes {

        interface Command {
            data: SlashCommandBuilder;
            execute: (interaction: CommandInteraction) => Promise<void>;
            isPermitted: (interaction: CommandInteraction) => boolean;
        }

        interface CommandContainer {
            [key: string]: Command;
        }

        type CustomId = string;
        type Unique = string;

        interface BackupMetadata {
            filename: string;
            dateCreated: number;
        }
    }
}
