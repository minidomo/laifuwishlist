import { Client, Intents } from 'discord.js';
import { commands } from './commands';
import { token } from './config';
import { CheckWishlist, UpdateDatabase } from './plugin';
import { CustomId, logger } from './utils';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] }) as Client<true>;

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
    UpdateDatabase.run(message);
    CheckWishlist.run(message);
});

client.on('interactionCreate', interaction => {
    if (!interaction.guild) return;

    if (interaction.isCommand()) {
        const command = commands.get(interaction.commandName);
        if (command && command.isPermitted(interaction)) {
            command.execute(interaction);
        }
    } else if (interaction.isModalSubmit()) {
        const group = CustomId.getGroup(interaction.customId);
        const command = commands.get(group);
        if (command && command.handleModal) {
            command.handleModal(interaction);
        }
    }
});

client.login(token);
