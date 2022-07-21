import { Client, GatewayIntentBits } from 'discord.js';
import { connect, connection } from 'mongoose';
import { commands } from './commands';
import { databaseUri, token } from './config';
import { CheckWishlist, GachaHistory, Reminders, UpdateCharacter } from './plugin';
import { CustomId, handleError, logger } from './util';

connect(databaseUri);

connection.once('open', () => {
    logger.info(`Connected to ${databaseUri}`);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
}) as Client<true>;

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
    UpdateCharacter.run(message).catch(handleError);
    CheckWishlist.run(message).catch(handleError);
    Reminders.run(message).catch(handleError);
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    UpdateCharacter.run(newMessage).catch(handleError);
    CheckWishlist.run(newMessage, oldMessage).catch(handleError);
    GachaHistory.run(newMessage, oldMessage).catch(handleError);
});

client.on('interactionCreate', interaction => {
    if (!interaction.guild) return;

    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName) as BotTypes.Command;
        if (command.isPermitted(interaction)) {
            command.execute(interaction, CustomId.createUnique());
        }
    }
});

client.login(token);
