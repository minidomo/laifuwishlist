import type { Message, PartialMessage } from 'discord.js';
import {
    BurnCharacterEmbed,
    GachaCharacterEmbed,
    InfoEmbed,
    isBurnCharacterEmbed,
    isGachaCharacterEmbed,
    isInfoEmbed,
    isLaifuBot,
    isViewEmbed,
    ViewEmbed,
} from 'laifutil';
import { Character } from '../model';
import { handleError, CharacterSchema } from '../util';

export function run(message: Message | PartialMessage) {
    if (!message.guild) return;

    if (message.author && !isLaifuBot(message.author.id)) return;

    const srcEmbed = message.embeds[0]?.toJSON();

    if (!srcEmbed) return;

    let schemaData: BotTypes.PartialCharacterSchema | undefined;

    if (isInfoEmbed(srcEmbed)) {
        const embed = new InfoEmbed(srcEmbed);
        schemaData = CharacterSchema.fromInfoEmbed(embed);
    } else if (isGachaCharacterEmbed(srcEmbed)) {
        const embed = new GachaCharacterEmbed(srcEmbed);
        schemaData = CharacterSchema.fromSimpleCharacter(embed);
    } else if (isViewEmbed(srcEmbed)) {
        const embed = new ViewEmbed(srcEmbed);
        schemaData = CharacterSchema.fromSimpleCharacter(embed);
    } else if (isBurnCharacterEmbed(srcEmbed)) {
        const embed = new BurnCharacterEmbed(srcEmbed);
        schemaData = CharacterSchema.fromSimpleCharacter(embed);
    }

    if (schemaData) {
        Character.updateOne({ id: schemaData.id }, schemaData, { upsert: true }, err => handleError(err as Error));
    }
}
