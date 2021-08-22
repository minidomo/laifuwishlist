const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

(() => {
    const dayjs = require('dayjs');
    const getCurrentTime = () => {
        return `${dayjs().format('YYYY-MM-DD hh:mm:ss.SSS A')}`;
    };

    const getLogFilename = () => {
        return `${dayjs().format('YYYY-MM-DD_hh-mm-ss_A')}.log`;
    };

    const winston = require('winston');
    const logger = winston.createLogger({
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({ filename: `./logs/${getLogFilename()}` }),
        ],
        format: winston.format.printf(log => `[${getCurrentTime()}] [${log.level.toUpperCase()}] ${log.message}`),
    });

    const log = (level, args) => {
        if (args.length === 0) return;
        let res = '';
        for (let i = 0; i < args.length; i++) {
            if (i > 0) {
                res += ' ';
            }
            if (typeof args[i] === 'object') {
                res += JSON.stringify(args[i], null, 4);
            } else {
                res += args[i];
            }
        }

        logger.log(level, res);
    };

    console.log = function () {
        log('info', arguments);
    };
    /**
     * @param {Error} err
     */
    console.error = function () {
        const arr = [...arguments];
        const err = arr.shift();
        log('error', [err.name, err.message, err.stack, ...arr]);
    };
})();

const database = require('./database');
const laifu = require('./laifu');
const wait = require('util').promisify(setTimeout);

client.on('messageCreate', async message => {
    if (!client.application?.owner) await client.application?.fetch();
    if (message.author.id === client.application?.owner.id) {
        const mention = `<@!${client.user.id}>`;
        if (message.content.startsWith(mention)) {
            const trimmed = message.content.substr(mention.length).trim().toLowerCase();
            switch (trimmed) {
                case 'current': {
                    await message.reply(`Currently have data on ${database.characterCount()} characters and ${database.seriesCount()} series`);
                    break;
                }
            }
        }
    } else if (message.author.id === laifu.id) {
        if (message.embeds.length === 1) {
            const [embed] = message.embeds;
            if (laifu.embed.isView(embed) || laifu.embed.isBurn(embed) || laifu.embed.isInfo(embed)) {
                try {
                    const character = {
                        gid: laifu.embed.getGID(embed),
                        name: laifu.embed.getName(embed),
                        series: {
                            eng: laifu.embed.getEngSeries(embed),
                            jp: laifu.embed.getJpSeries(embed),
                            sid: laifu.embed.getSID(embed),
                        },
                    };
                    database.add(character);
                    const type = laifu.embed.isView(embed) ? 'VIEW' : (laifu.embed.isBurn(embed) ? 'BURN' : 'INFO');
                    console.log(type, 'ADDED', character.name);
                } catch (err) {
                    const type = laifu.embed.isView(embed) ? 'VIEW' : (laifu.embed.isBurn(embed) ? 'BURN' : 'INFO');
                    console.error(err, type, embed);
                }
            }
        }
    }
});

client.on('messageUpdate', async message => {
    if (!client.application?.owner) await client.application?.fetch();
    if (message.author.id === laifu.id) {
        wait(1000)
            .then(async () => {
                const msg = await message.channel.messages.fetch(message.id);
                if (msg.embeds.length === 1) {
                    const [embed] = msg.embeds;
                    if (laifu.embed.isGacha(embed)) {
                        const character = {
                            gid: laifu.embed.getGID(embed),
                            name: laifu.embed.getName(embed),
                            series: {
                                eng: laifu.embed.getEngSeries(embed),
                                jp: laifu.embed.getJpSeries(embed),
                                sid: laifu.embed.getSID(embed),
                            },
                        };
                        database.add(character);
                        console.log('GACHA', 'ADDED', character.name);
                    }
                }
            })
            .catch(console.error);
    }
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
