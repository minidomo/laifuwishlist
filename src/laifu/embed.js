// const Discord = require('discord.js');

module.exports = {
    /**
     * @param {Discord.MessageEmbed} embed
     * @returns {boolean}
     */
    isGacha(embed) {
        return embed.fields.some(e => e.name === 'Account');
    },
    /**
     * @param {Discord.MessageEmbed} embed
     * @returns {boolean}
     */
    isView(embed) {
        return embed.author && embed.author.name && embed.author.name.endsWith('is Viewing...');
    },
    /**
     * @param {Discord.MessageEmbed} embed
     * @returns {boolean}
     */
    isBurn(embed) {
        return embed.fields.some(e => e.name === 'Guide');
    },
    /**
     * @param {Discord.MessageEmbed} embed
     * @returns {boolean}
     */
    isInfo(embed) {
        return embed.author && embed.author.name && embed.author.name === 'Information Card';
    },
    /**
     * @param {Discord.MessageEmbed} embed
     * @returns {number}
     */
    getCardNumber(embed) {
        const title = embed.title;
        const REGEX = /.*#(\d).+/;
        const [, num] = REGEX.exec(title);
        return parseInt(num);
    },
    /**
    * @param {Discord.MessageEmbed} embed
    * @returns {number}
    */
    getGID(embed) {
        const field = embed.fields.find(e => e.name === 'General Info');
        const REGEX = /.*\*\*(?:GID|Global ID):\*\* (\d+).*/;
        const [, gid] = REGEX.exec(field.value);
        return parseInt(gid);
    },
    /**
    * @param {Discord.MessageEmbed} embed
    * @returns {number}
    */
    getSID(embed) {
        const field = embed.fields.find(e => e.name === 'Main Series');
        const REGEX = /.*\*\*(?:SID|Series ID):\*\* (\d+).*/;
        const [, sid] = REGEX.exec(field.value);
        return parseInt(sid);
    },
    /**
    * @param {Discord.MessageEmbed} embed
    * @returns {string}
    */
    getEngSeries(embed) {
        const field = embed.fields.find(e => e.name === 'Main Series');
        const REGEX = /.*\*\*ENG:\*\* (.+)\n/;
        const [, eng] = REGEX.exec(field.value);
        return eng;
    },
    /**
    * @param {Discord.MessageEmbed} embed
    * @returns {string}
    */
    getJpSeries(embed) {
        const field = embed.fields.find(e => e.name === 'Main Series');
        const REGEX = /.*\*\*JP:\*\* (.+)\n/;
        const [, jp] = REGEX.exec(field.value);
        return jp;
    },
    /**
    * @param {Discord.MessageEmbed} embed
    * @returns {string}
    */
    getName(embed) {
        const REGEX = /(?:. )?(?:#\d )?(.+) [(][^(]+/;
        const [, name] = REGEX.exec(embed.title);
        return name;
    },
};