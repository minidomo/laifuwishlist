import { Message, MessageEmbed, PartialMessage } from 'discord.js';
import {
    BasePersonalSimpleCharacterEmbed,
    BurnCharacterEmbed,
    GachaCharacterEmbed,
    hasSameImage,
    isBurnCharacterEmbed,
    isGachaCharacterEmbed,
    isLaifuBot,
    isViewEmbed,
    ViewEmbed,
} from 'laifutil';
import { User } from '../model';

export async function run(newMessage: Message | PartialMessage, oldMessage?: Message | PartialMessage) {
    if (!newMessage.guild) return;

    const srcEmbed = newMessage.embeds[0];
    const oldEmbed = oldMessage?.embeds[0];

    if (srcEmbed && oldEmbed && hasSameImage(srcEmbed, oldEmbed)) return;

    if (srcEmbed && isLaifuBot(newMessage)) {
        let charEmbed: BasePersonalSimpleCharacterEmbed | null = null;

        if (isGachaCharacterEmbed(srcEmbed)) {
            charEmbed = new GachaCharacterEmbed(srcEmbed);
        } else if (isBurnCharacterEmbed(srcEmbed)) {
            charEmbed = new BurnCharacterEmbed(srcEmbed);
        } else if (isViewEmbed(srcEmbed)) {
            charEmbed = new ViewEmbed(srcEmbed);
        }

        if (charEmbed) {
            const seriesFilter: Record<string, boolean> = {};
            seriesFilter[`guildIds.${newMessage.guild.id}`] = true;
            seriesFilter[`seriesIds.${charEmbed.series.id}`] = true;

            const characterFilter: Record<string, boolean | RegExp> = {};
            characterFilter[`guildIds.${newMessage.guild.id}`] = true;
            characterFilter[`globalIds.${charEmbed.globalId}`] = new RegExp(`${charEmbed.image.currentNumber}`);

            const seriesUsers = await User.find(seriesFilter).select('id').lean();
            const characterUsers = await User.find(characterFilter).select('id').lean();

            const userIdSet: Set<string> = new Set();
            seriesUsers.forEach(e => userIdSet.add(e.id));
            characterUsers.forEach(e => userIdSet.add(e.id));

            const userIds = Array.from(userIdSet);

            if (userIds.length > 0) {
                const embed = new MessageEmbed()
                    .setColor(0xc7efcf)
                    .setTitle('Users that may be interested')
                    .setDescription(userIds.map(id => `<@${id}>`).join(' '));

                await newMessage.reply({ embeds: [embed] });
            }
        }
    }
}
