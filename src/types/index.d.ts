import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

declare global {
    namespace BotTypes {
        
        type CustomId = string;
        type Unique = string;

        interface Command {
            data: SlashCommandBuilder;
            execute: (interaction: CommandInteraction) => Promise<void>;
            isPermitted: (interaction: CommandInteraction) => boolean;
        }

        interface BackupMetadata {
            filename: string;
            dateCreated: number;
        }
    }
}
