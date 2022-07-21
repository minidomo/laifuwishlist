import type { Message, PartialMessage } from 'discord.js';
import {
    BurnCharacterEmbed,
    CluSearchEmbed,
    GachaCharacterEmbed,
    InfoEmbed,
    isBurnCharacterEmbed,
    isCluSearchEmbed,
    isGachaCharacterEmbed,
    isInfoEmbed,
    isLaifuBot,
    isViewEmbed,
    ViewEmbed,
} from 'laifutil';
import { Character } from '../model';
import { CharacterSchema } from '../util';

export function run(message: Message | PartialMessage) {
    if (!message.guild) return;

    if (message.author && !isLaifuBot(message.author.id)) return;

    const srcEmbed = message.embeds[0]?.toJSON();

    if (!srcEmbed) return;

    const dataArr: BotTypes.PartialCharacterSchema[] = [];

    if (isInfoEmbed(srcEmbed)) {
        const embed = new InfoEmbed(srcEmbed);
        dataArr.push(CharacterSchema.fromInfoEmbed(embed));
    } else if (isGachaCharacterEmbed(srcEmbed)) {
        const embed = new GachaCharacterEmbed(srcEmbed);
        dataArr.push(CharacterSchema.fromSimpleCharacter(embed));
    } else if (isViewEmbed(srcEmbed)) {
        const embed = new ViewEmbed(srcEmbed);
        dataArr.push(CharacterSchema.fromSimpleCharacter(embed));
    } else if (isBurnCharacterEmbed(srcEmbed)) {
        const embed = new BurnCharacterEmbed(srcEmbed);
        dataArr.push(CharacterSchema.fromSimpleCharacter(embed));
    } else if (isCluSearchEmbed(srcEmbed)) {
        const embed = new CluSearchEmbed(srcEmbed);
        embed.characters.forEach(e => dataArr.push(CharacterSchema.fromCluCharacter(e)));
    }

    dataArr.forEach(async e => {
        const res = await Character.updateOne({ id: e.id }, e);

        if (res.matchedCount !== 1) {
            const character = new Character(e);
            await character.save();
        }
    });
}
