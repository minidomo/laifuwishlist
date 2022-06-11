import { Client, Intents } from 'discord.js';
import { isInfoEmbed, isLaifuBot } from 'laifutil';
import { commands } from './commands';
import { token } from './config';
import { embeds } from './embed-storage';
import { logger } from './logger';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }) as Client<true>;

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (isLaifuBot(message) && message.embeds[0]) {
        const embed = message.embeds[0];

        if (isInfoEmbed(embed)) {
            embeds.push(embed.toJSON());
        }
    }
});

client.on('interactionCreate', interaction => {
    if (!interaction.isCommand()) return;

    const command = commands.get(interaction.commandName);
    if (command) {
        command.execute(interaction);
    }
});

client.login(token);
