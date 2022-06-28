import { Client, Intents } from 'discord.js';
import { connect, connection } from 'mongoose';
import { commands } from './commands';
import { databaseUri, token } from './config';
import { CheckWishlist, UpdateCharacter } from './plugin';
import { logger } from './util';

connect(databaseUri);

connection.once('open', () => {
    logger.info(`Connected to ${databaseUri}`);
});

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }) as Client<true>;

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
    UpdateCharacter.run(message);
    CheckWishlist.run(message);
});

client.on('interactionCreate', interaction => {
    if (!interaction.guild) return;

    if (interaction.isCommand()) {
        const command = commands.get(interaction.commandName);
        if (command && command.isPermitted(interaction)) {
            command.execute(interaction);
        }
    }
});

client.login(token);
