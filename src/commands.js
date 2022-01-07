'use strict';

// .const Discord = require('discord.js');
const fs = require('fs');
const dayjs = require('dayjs');
const config = require('../config.json');
const database = require('./database');

/**
 * @type {Discord.Client}
 */
let _client;

module.exports = {
    /**
     * @param {Discord.Client} client
     */
    init(client) {
        _client = client;
    },
    /**
     * @param {Discord.Message} message
     */
    async handler(message) {
        const mention = `<@!${_client.user.id}>`;
        if (message.content.startsWith(mention)) {
            const trimmed = message.content.substring(mention.length).trim().toLowerCase();
            switch (trimmed) {
                case 'current': {
                    const str = `Currently have data on ${database.characterCount()}`
                        + ` characters and ${database.seriesCount()} series`;
                    await message.reply(str);
                    break;
                }
                case 'save': {
                    database.export();
                    const str = 'Saving current data';
                    await message.reply(str);
                    break;
                }
                case 'gids': {
                    const filename = `gids-${dayjs().format('MMDDHHmmss')}.data`;
                    const path = `${config.temp.data.dir}/${filename}`;
                    const content = database.gids().join('\n');
                    if (!fs.existsSync(config.temp.data.dir)) {
                        fs.mkdirSync(config.temp.data.dir, { recursive: true });
                    }
                    fs.writeFileSync(path, content, { encoding: 'utf-8' });
                    await message.reply({
                        files: [
                            {
                                attachment: path,
                                name: filename,
                                description: 'The current GIDs in the bot',
                            },
                        ],
                    });
                    fs.unlinkSync(path);
                    break;
                }
            }
        }
    },
};
