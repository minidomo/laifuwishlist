'use strict';

require('./init').run();

const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });

const Laifu = require('laifu-util');
const database = require('./database');
const commands = require('./commands');

commands.init(client);

/**
 * @param {Discord.Message} message
 */
const laifuFunction = message => {
    if (!message) return;
    const embed = message.embeds[0];
    if (embed.type !== 'rich') return;

    const Identifier = Laifu.Identifier;
    const Character = Laifu.Character;
    if (Identifier.isViewEmbed(embed) || Identifier.isBurnEmbed(embed) || Identifier.isGachaCharacterEmbed(embed)) {
        const character = {
            gid: Character.getGid(embed),
            name: Character.getName(embed),
            series: {
                eng: Character.getEngSeries(embed),
                jp: Character.getJpSeries(embed),
                sid: Character.getSid(embed),
            },
        };
        database.add(character);
        console.log('ADDED', character.name);
    }
};

client.on('messageCreate', async message => {
    if (!client.application?.owner) await client.application?.fetch();

    commands.handler(message);
    Laifu.Util.hasLaifuEmbed(message, { loaded: false, duplicates: false })
        .then(laifuFunction);
});

client.on('messageUpdate', async message => {
    if (!client.application?.owner) await client.application?.fetch();

    Laifu.Util.hasLaifuEmbed(message, { delay: 1000, loaded: false, duplicates: false })
        .then(laifuFunction);
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    setInterval(database.export, 1000 * 60 * 5);
});

if (process.argv.length > 2 && process.argv[2] === '--production') {
    client.login(process.env.PROD_TOKEN);
} else {
    client.login(process.env.DEV_TOKEN);
}

process.on('SIGINT', process.exit);
process.on('exit', () => {
    database.export();
    console.log('Shutting down');
});
