import {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from '@discordjs/builders';
import { CommandInteraction, MessageEmbed, ModalSubmitInteraction } from 'discord.js';
import type { Document, LeanDocument } from 'mongoose';

declare global {
    namespace BotTypes {
        type CustomId = string;
        type Unique = string;

        type Modification = 'add' | 'remove';

        interface BaseCommand<T> {
            data: T;
            execute: (interaction: CommandInteraction, unique: Unique) => Promise<void>;
            isPermitted: (interaction: CommandInteraction) => boolean;
        }

        type Command = BaseCommand<SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder>;
        type Subcommand = BaseCommand<SlashCommandSubcommandBuilder>;

        interface MongoTimestamps {
            createdAt: Date;
            updatedAt: Date;
        }

        // Character schema and documents
        type CharacterDocument = Document<unknown, any, CharacterSchema> & CharacterSchema; // eslint-disable-line
        type LeanCharacterDocument = LeanDocument<CharacterSchema>;

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

        interface PartialCharacterSchema extends Partial<MongoTimestamps> {
            name: string;
            id: number;
            influence: number;
            influenceRankRange?: InfluenceRankRangeSchema;
            rarities?: RarityInfoCollectionSchema;
            series: SeriesSchema;
            totalImages?: number;
        }

        type CharacterSchema = Required<PartialCharacterSchema>;

        // User schema and documents
        type UserDocument = Document<unknown, any, UserSchema> & UserSchema & MongoTimestamps; // eslint-disable-line
        type LeanUserDocument = LeanDocument<LeanUserSchema> & MongoTimestamps;

        type GachaType = 'badge' | 'character';

        interface GachaResultBadgeSchema {
            tier: number;
            badgeId: number;
        }

        interface GachaResultCharacterSchema {
            globalId: number;
            uniqueId: number;
            rarity: string;
            image: number;
        }

        interface BaseGachaResultSchema extends Partial<GachaResultCharacterSchema>, Partial<GachaResultBadgeSchema> {
            gachaType: GachaType;
            stonesUsed: number;
        }

        type PartialGachaResultSchema = BaseGachaResultSchema & Partial<MongoTimestamps>;

        type GachaResultSchema = BaseGachaResultSchema & MongoTimestamps;

        interface GachaHistorySchema {
            enabled: boolean;
            history: GachaResultSchema[];
        }

        interface ReminderSchema {
            drop: boolean;
            medal: boolean;
        }

        interface PartialUserSchema extends Partial<MongoTimestamps> {
            id: string;
            seriesIds?: Map<string, boolean>;
            guildIds?: Map<string, boolean>;
            globalIds?: Map<string, string>;
            reminder?: ReminderSchema;
            gachaHistory?: GachaHistorySchema;
        }

        type UserSchema = Required<PartialUserSchema>;

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
            page?: number;
            ephemeral?: boolean;
            deferred?: boolean;
        }

        // Gacha history
        interface GachaResult {
            result: GachaResultSchema;
            character?: LeanCharacterDocument;
        }

        // Character map
        type IdType = 'global' | 'series';
    }
}
