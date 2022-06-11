import { REST } from '@discordjs/rest';
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord-api-types/v9';
import { commands } from './commands';
import { clientId, guildsIds, token } from './config';
import { logger } from './logger';

const commandsJson: RESTPostAPIApplicationCommandsJSONBody[] = [];
commands.forEach(command => commandsJson.push(command.data.toJSON()));

const rest = new REST({ version: '9' }).setToken(token);

guildsIds.forEach(guildId => {
    logger.info(`Started refreshing application (/) commands: ${guildId}`);

    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandsJson })
        .then(() => logger.info(`Successfully reloaded application (/) commands: ${guildId}`))
        .catch(logger.error);
});
