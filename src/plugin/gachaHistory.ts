import type { Message, PartialMessage } from 'discord.js';
import { GachaCharacterEmbed, hasSameImage, isGachaCharacterEmbed, isLaifuBot } from 'laifutil';
import { User } from '../model';

export async function run(newMessage: Message | PartialMessage, oldMessage: Message | PartialMessage) {
    if (!newMessage.guild || !isLaifuBot(newMessage)) return;

    const srcEmbed = newMessage.embeds[0];
    const oldEmbed = oldMessage.embeds[0];

    if (srcEmbed && oldEmbed && hasSameImage(srcEmbed, oldEmbed)) return;

    if (srcEmbed && isGachaCharacterEmbed(srcEmbed)) {
        const embed = new GachaCharacterEmbed(srcEmbed);
        const user = await User.findOne({ id: embed.userId, 'gachaHistory.enabled': true });

        if (user) {
            const schemaData: BotTypes.PartialGachaResultSchema = {
                gachaType: 'character',
                stonesUsed: embed.stonesUsed,
                globalId: embed.globalId,
                uniqueId: embed.uniqueId,
                rarity: embed.rarity.SYMBOL,
            };

            user.gachaHistory.history.push(schemaData);

            await user.save();
        }
    }
}
