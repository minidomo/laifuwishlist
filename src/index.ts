import { Client, Intents } from 'discord.js';
import { InfoEmbed, isInfoEmbed, isLaifuBot } from 'laifutil';
import * as CharacterDatabase from './CharacterDatabase';
import { commands } from './commands';
import { token } from './config';
import { logger } from './logger';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }) as Client<true>;

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (isLaifuBot(message) && message.embeds[0]) {
        const embed = message.embeds[0];

        if (isInfoEmbed(embed)) {
            CharacterDatabase.update(new InfoEmbed(embed));
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
