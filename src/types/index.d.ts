import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import type { Document, LeanDocument } from 'mongoose';

declare global {
    namespace BotTypes {

        type CustomId = string;
        type Unique = string;

        type Modification = 'add' | 'remove';

        type CharacterDocument = Document & CharacterSchema & Timestamps;
        type UserDocument = Document & UserSchema & Timestamps;

        type LeanCharacterDocument = LeanDocument<CharacterSchema> & Timestamps;
        type LeanUserDocument = LeanDocument<LeanUserSchema> & Timestamps;

        interface Command {
            data: SlashCommandBuilder;
            execute: (interaction: CommandInteraction) => Promise<void>;
            isPermitted: (interaction: CommandInteraction) => boolean;
        }

        interface BackupMetadata {
            filename: string;
            dateCreated: number;
        }

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

        interface CharacterSchema {
            name: string;
            id: number;
            influence: number;
            influenceRankRange: InfluenceRankRangeSchema;
            rarities: RarityInfoCollectionSchema;
            series: SeriesSchema;
            totalImages: number;
        }

        interface Timestamps {
            createdAt: string;
            updatedAt: string;
        }

        interface UserSchema {
            id: string;
            seriesIds: Map<string, boolean>;
            guildIds: Map<string, boolean>;
            globalIds: Map<string, string>;
        }

        interface LeanUserSchema {
            id: string;
            seriesIds: Record<string, boolean>;
            guildIds: Record<string, boolean>;
            globalIds: Record<string, string>;
        }

        interface WishlistCharacter {
            globalId: number;
            images: Set<number>;
        }
    }
}
