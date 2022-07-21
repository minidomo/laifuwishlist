import type { Message, PartialMessage } from 'discord.js';
import {
    BadgeRarity,
    CharacterRaritySymbol,
    GachaBadgeEmbed,
    GachaCharacterEmbed,
    hasSameImage,
    isGachaBadgeEmbed,
    isGachaCharacterEmbed,
    isLaifuBot,
} from 'laifutil';
import { User } from '../model';

export async function run(newMessage: Message | PartialMessage, oldMessage: Message | PartialMessage) {
    if (!newMessage.guild) return;

    if (newMessage.author && !isLaifuBot(newMessage.author.id)) return;

    const srcEmbed = newMessage.embeds[0]?.toJSON();
    const oldEmbed = oldMessage?.embeds[0]?.toJSON();

    if (!srcEmbed) return;

    if (oldEmbed && hasSameImage(srcEmbed, oldEmbed)) return;

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
                    rarity: CharacterRaritySymbol[embed.rarity],
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
                    tier: BadgeRarity[embed.rarity],
                    badgeId: embed.id,
                    title: embed.title,
                };

                user.gachaHistory.history.push(schemaData);

                await user.save();
            }
        }
    }
}
