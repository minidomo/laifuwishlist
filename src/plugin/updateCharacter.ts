import type { Message } from 'discord.js';
import { InfoEmbed, isInfoEmbed, isLaifuBot } from 'laifutil';
import { character } from '../database';

export function run(message: Message) {
    if (!message.guild) return;

    const srcEmbed = message.embeds[0];

    if (srcEmbed && isLaifuBot(message) && isInfoEmbed(srcEmbed)) {
        character.update(new InfoEmbed(srcEmbed));
    }
}
