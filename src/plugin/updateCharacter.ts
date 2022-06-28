import type { Message } from 'discord.js';
import { InfoEmbed, isInfoEmbed, isLaifuBot } from 'laifutil';
import { Character } from '../model';
import { Transform } from '../util';

export function run(message: Message) {
    if (!message.guild) return;

    const srcEmbed = message.embeds[0];

    if (srcEmbed && isLaifuBot(message) && isInfoEmbed(srcEmbed)) {
        const embed = new InfoEmbed(srcEmbed);
        const schemaData = Transform.infoEmbedToCharacterSchema(embed);
        Character.updateOne({ id: schemaData.id }, schemaData, { upsert: true }, err => {
            if (err) {
                console.error(err);
            }
        });
    }
}
