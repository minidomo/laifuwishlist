import { Client, Intents, MessageEmbed } from 'discord.js';
import {
    BaseSimpleCharacter,
    BurnCharacterEmbed,
    GachaCharacterEmbed,
    InfoEmbed,
    isBurnCharacterEmbed,
    isGachaCharacterEmbed,
    isInfoEmbed,
    isLaifuBot,
    isViewEmbed,
    ViewEmbed,
} from 'laifutil';
import { commands } from './commands';
import { token } from './config';
import { character, wishlist } from './database';
import { logger } from './logger';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }) as Client<true>;

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (isLaifuBot(message) && message.embeds[0]) {
        const embed = message.embeds[0];

        if (isInfoEmbed(embed)) {
            character.update(new InfoEmbed(embed));
        } else if (isGachaCharacterEmbed(embed) || isBurnCharacterEmbed(embed) || isViewEmbed(embed)) {
            let characterEmbed: BaseSimpleCharacter;

            if (isGachaCharacterEmbed(embed)) {
                characterEmbed = new GachaCharacterEmbed(embed);
            } else if (isBurnCharacterEmbed(embed)) {
                characterEmbed = new BurnCharacterEmbed(embed);
            } else {
                characterEmbed = new ViewEmbed(embed);
            }

            const userIds = wishlist.search(
                characterEmbed.globalId,
                characterEmbed.series.id,
                characterEmbed.image.currentNumber,
            );

            if (userIds.length > 0) {
                const pingEmbed = new MessageEmbed()
                    .setTitle('Users that may be interested')
                    .setDescription(userIds.map(id => `<@${id}>`).join(' '))
                    .setFooter({ text: 'Developed by JB#9224' });

                message.reply({ embeds: [pingEmbed] });
            }
        }
    }
});

client.on('interactionCreate', interaction => {
    if (interaction.isCommand()) {
        const command = commands.get(interaction.commandName);
        if (command) {
            command.execute(interaction);
        }
    }
});

client.login(token);
