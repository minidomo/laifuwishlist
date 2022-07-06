import { setTimeout } from 'node:timers/promises';
import { userMention } from '@discordjs/builders';
import type { Message } from 'discord.js';
import { DropOpenedEmbed, isDropOpenedEmbed, isLaifuBot } from 'laifutil';
import { User } from '../model';

const interval = 360_000;

export async function run(message: Message) {
    if (!message.guild) return;

    const srcEmbed = message.embeds[0];

    if (isLaifuBot(message) && isDropOpenedEmbed(srcEmbed)) {
        const embed = new DropOpenedEmbed(srcEmbed);
        const user = await User.findOne({ id: embed.userId }).select('reminder.drop').lean();

        if (user && user.reminder.drop) {
            await setTimeout(interval);
            const content = `Time to drop! ${userMention(embed.userId)}`;
            message.reply({ content });
        }
    }
}
