import { setTimeout } from 'node:timers/promises';
import { Message, userMention } from 'discord.js';
import { DropOpenedEmbed, isDropOpenedEmbed, isLaifuBot, isMedalDropActiveEmbed } from 'laifutil';
import { User } from '../model';

const dropInterval = 360_000;

export async function run(message: Message) {
    if (!message.guild) return;

    if (message.author && !isLaifuBot(message.author.id)) return;

    const srcEmbed = message.embeds[0]?.toJSON();

    if (!srcEmbed) return;

    if (isDropOpenedEmbed(srcEmbed)) {
        const embed = new DropOpenedEmbed(srcEmbed);

        if (embed.userId) {
            const user = await User.findOne({ id: embed.userId }).select('reminder.drop').lean();

            if (user && user.reminder.drop) {
                await setTimeout(dropInterval);
                const content = `Time to drop! ${userMention(embed.userId)}`;
                message.reply({ content });
            }
        }
    } else if (isMedalDropActiveEmbed(srcEmbed)) {
        const filter: Record<string, boolean> = {};
        filter[`guildIds.${message.guild.id}`] = true;
        filter['reminder.medal'] = true;

        const users = await User.find(filter).select('id').lean();

        if (users.length) {
            const pings = users.map(user => userMention(user.id)).join(' ');
            const content = `Medal drop!\n${pings}`;
            message.reply({ content });
        }
    }
}
