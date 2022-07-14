import type { Message, PartialMessage } from 'discord.js';
import {
    GachaBadgeEmbed,
    GachaCharacterEmbed,
    hasSameImage,
    isGachaBadgeEmbed,
    isGachaCharacterEmbed,
    isLaifuBot,
} from 'laifutil';
import { User } from '../model';

export async function run(newMessage: Message | PartialMessage, oldMessage: Message | PartialMessage) {
    if (!newMessage.guild || !isLaifuBot(newMessage)) return;

    const srcEmbed = newMessage.embeds[0];
    const oldEmbed = oldMessage.embeds[0];

    if (srcEmbed && oldEmbed && hasSameImage(srcEmbed, oldEmbed)) return;

    if (!srcEmbed) return;

    if (isGachaCharacterEmbed(srcEmbed)) {
        const embed = new GachaCharacterEmbed(srcEmbed);

        if (embed.userId) {
            const user = await User.findOne({ id: embed.userId, 'gachaHistory.enabled': true });

            if (user) {
                const schemaData: BotTypes.PartialGachaResultSchema = {
                    gachaType: 'character',
                    stonesUsed: embed.stonesUsed,
                    globalId: embed.globalId,
                    uniqueId: embed.uniqueId,
                    rarity: embed.rarity.SYMBOL,
                    image: embed.image.currentNumber,
                };

                user.gachaHistory.history.push(schemaData);

                await user.save();
            }
        }
    } else if (isGachaBadgeEmbed(srcEmbed)) {
        const embed = new GachaBadgeEmbed(srcEmbed);

        if (embed.userId) {
            const user = await User.findOne({ id: embed.userId, 'gachaHistory.enabled': true });

            if (user) {
                const schemaData: BotTypes.PartialGachaResultSchema = {
                    gachaType: 'badge',
                    stonesUsed: embed.stonesUsed,
                    tier: embed.rarity,
                    badgeId: embed.id,
                    title: embed.title,
                };

                user.gachaHistory.history.push(schemaData);

                await user.save();
            }
        }
    }
}
