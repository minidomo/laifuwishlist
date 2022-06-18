import { Message, MessageEmbed } from 'discord.js';
import {
    BaseSimpleCharacter,
    BurnCharacterEmbed,
    GachaCharacterEmbed,
    isBurnCharacterEmbed,
    isGachaCharacterEmbed,
    isLaifuBot,
    isViewEmbed,
    ViewEmbed,
} from 'laifutil';
import { wishlist } from '../database';

export async function run(message: Message) {
    if (!message.guild) return;

    const srcEmbed = message.embeds[0];

    if (srcEmbed && isLaifuBot(message)) {
        let charEmbed: BaseSimpleCharacter | null = null;

        if (isGachaCharacterEmbed(srcEmbed)) {
            charEmbed = new GachaCharacterEmbed(srcEmbed);
        } else if (isBurnCharacterEmbed(srcEmbed)) {
            charEmbed = new BurnCharacterEmbed(srcEmbed);
        } else if (isViewEmbed(srcEmbed)) {
            charEmbed = new ViewEmbed(srcEmbed);
        }

        if (charEmbed) {
            const userIds = wishlist.search(
                message.guild.id,
                charEmbed.globalId,
                charEmbed.series.id,
                charEmbed.image.currentNumber,
            );

            if (userIds.length > 0) {
                const embed = new MessageEmbed()
                    .setColor(0xC7EFCF)
                    .setTitle('Users that may be interested')
                    .setDescription(userIds.map(id => `<@${id}>`).join(' '))
                    .setFooter({ text: 'Developed by JB#9224' });

                await message.reply({ embeds: [embed] });
            }
        }
    }
}
