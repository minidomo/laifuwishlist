import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed, ModalSubmitInteraction } from 'discord.js';
import type { Document, LeanDocument } from 'mongoose';

declare global {
    namespace BotTypes {

        type CustomId = string;
        type Unique = string;

        type Modification = 'add' | 'remove';

        interface Command {
            data: SlashCommandBuilder;
            execute: (interaction: CommandInteraction) => Promise<void>;
            isPermitted: (interaction: CommandInteraction) => boolean;
        }

        interface Timestamps {
            createdAt: string;
            updatedAt: string;
        }

        // Character schema and documents
        type CharacterDocument = Document<unknown, any, CharacterSchema> & CharacterSchema & Timestamps;
        type LeanCharacterDocument = LeanDocument<CharacterSchema> & Timestamps;

        interface InfluenceRankRangeSchema {
            lower: number;
            upper: number;
        }

        interface RarityInfoSchema {
            existingAmount: number;
            totalClaimed: number;
        }

        interface RarityInfoCollectionSchema {
            alpha: RarityInfoSchema;
            beta: RarityInfoSchema;
            delta: RarityInfoSchema;
            epsilon: RarityInfoSchema;
            gamma: RarityInfoSchema;
            ultra: RarityInfoSchema;
            zeta: RarityInfoSchema;
        }

        interface TitleSchema {
            alternate: string;
            english: string;
        }

        interface SeriesSchema {
            title: TitleSchema;
            id: number;
            sequence: string;
        }

        interface PartialCharacterSchema {
            name: string;
            id: number;
            influence: number;
            influenceRankRange?: InfluenceRankRangeSchema;
            rarities?: RarityInfoCollectionSchema;
            series: SeriesSchema;
            totalImages?: number;
        }

        type CharacterSchema = Required<PartialCharacterSchema>

        // User schema and documents
        type UserDocument = Document<unknown, any, UserSchema> & UserSchema & Timestamps;
        type LeanUserDocument = LeanDocument<LeanUserSchema> & Timestamps;

        interface ReminderSchema {
            drop: boolean;
            medal: boolean;
        }

        interface PartialUserSchema {
            id: string;
            seriesIds?: Map<string, boolean>;
            guildIds?: Map<string, boolean>;
            globalIds?: Map<string, string>;
            reminder?: ReminderSchema;
        }

        type UserSchema = Required<PartialUserSchema>

        interface LeanUserSchema extends Omit<UserSchema, 'seriesIds' | 'guildIds' | 'globalIds'> {
            seriesIds: Record<string, boolean>;
            guildIds: Record<string, boolean>;
            globalIds: Record<string, string>;
        }

        // Pages
        interface PagesOptions {
            interaction: CommandInteraction | ModalSubmitInteraction;
            unique: Unique;
            lines: string[];
            itemName: string;
            embed?: MessageEmbed;
            linesPerPage?: number;
            idleTime?: number;
        }

        interface PagesStartOptions {
            ephemeral?: boolean;
            deferred?: boolean;
        }

    }
}
