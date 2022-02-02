require('dotenv').config();
const Discord = require('discord.js');

class DiscordBot {
    constructor() {
        this.bot = new Discord.Client();
        this.bot.login(process.env.DISCORD_BOT_TOKEN);
    }
}

const discordBot = new DiscordBot();

module.exports = discordBot.bot;