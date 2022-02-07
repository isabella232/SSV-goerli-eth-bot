require('discord-reply');
require('dotenv').config();
require('./db');
const web3 = require('web3');
const crypto = require('crypto');
const utils = require('./utils');
const redisStore = require('./redis');
const Logger = require('./logger.js');
const Discord = require('discord.js');
const config = require('./config/config');
const goerliBot = require('./goerliBot.js');
const bot = require('./initializers/DiscordBot');
const queueHandler = require('./queueHandler.js');
const walletSwitcher = require("./initializers/WalletSwitcher");


let allowedValidatorsAmount;
let channelIsOnline = true;

const COMMAND_PREFIX = '+goerlieth';
const title = 'SSV Goerli Deposit Bot';
const adminID = [844110609142513675, 724238721028980756, 876421771400740874, 836513795194355765];

const EMBEDDED_HELP_MESSAGE = new Discord.MessageEmbed().setTitle(title).setColor(config.COLORS.BLUE)
    .setDescription(config.MESSAGES.MODE.HELP)
    .addField("+goerlieth <address> <hex-data>", 'To start you need to register the **wallet address** you used to generate the **hex** and the **hex** itself.')
    .addField("+goerlieth help", 'Help with the bot.')
    .addField("+goerlieth mod", "Ping the admins for help if the **BOT** is malfunctioning (spamming this will result in a **BAN**)")

bot.on('ready', async function () {
    allowedValidatorsAmount = await getAmountOfValidatorsAllowed();
    queueHandler.executeQueueList();
    Logger.log('I am ready!');
})

bot.on('message', async (message) => {
    if (message.channel.id === config.SHEET_REPLY_CHANNEL) {
        const args = (message.content.split(/ |\n/)).filter(n => n);
        const uniqId = args[0]
        const status = args[1]
        if(uniqId === 'clean') {
            await redisStore.removeAllItems();
            return;
        }
        if (!uniqId || (status !== 'true' && status !== 'false')) return;
        await redisStore.changeFormSubmitted(uniqId, status === 'true');
    }
    try {
        if (message.channel.id !== config.CHANNEL_ID) return
        if (!message || !message.content || message.content.substring(0, COMMAND_PREFIX.length) !== COMMAND_PREFIX) return;

        let text = '';
        const embed = new Discord.MessageEmbed()
        const args = (message.content.substring(COMMAND_PREFIX.length).split(/ |\n/)).filter(n => n)
        const address = args[0];
        const hexData = args[1];
        let channel = message.channel;
        let textColor = config.COLORS.BLUE;
        if (address !== 'start' && 0 >= allowedValidatorsAmount  && channelIsOnline) {
            console.log('<<<<<<<<<<<close channel>>>>>>>>>>>')
            channelIsOnline = false;
            await channel.updateOverwrite(config.VERIFIED_ROLE_ID, {SEND_MESSAGES: false, VIEW_CHANNEL: true});
            embed.setDescription(config.MESSAGES.ERRORS.END_OF_CYCLE).setTimestamp().setColor(config.COLORS.BLUE);
            await message.lineReply(embed);
            return;
        }

        if (address === 'start' && adminID.includes(Number(message.author.id))) {
            console.log('<<<<<<<<<<<start channel>>>>>>>>>>>')
            allowedValidatorsAmount = await getAmountOfValidatorsAllowed();
            await channel.updateOverwrite(config.VERIFIED_ROLE_ID, {SEND_MESSAGES: true, VIEW_CHANNEL: true});
            channelIsOnline = true;
            return;
        }

        // check if user request other commands
        if (address === 'help') {
            const attachment = new Discord.MessageAttachment('./src/img.png', 'img.png');
            EMBEDDED_HELP_MESSAGE.attachFiles(attachment).setImage('attachment://img.png');
            await message.lineReply(EMBEDDED_HELP_MESSAGE);
        }

        // check user's params
        if (address === 'mod') text = config.MESSAGES.MODE.MOD;
        if (!address) {
            textColor = config.COLORS.RED;
            text = config.MESSAGES.ERRORS.INVALID_NUMBER_OF_ARGUMENTS_ADDRESS;
        }
        if (!hexData && address && web3.utils.isAddress(address)) {
            textColor = config.COLORS.RED;
            text = config.MESSAGES.ERRORS.INVALID_NUMBER_OF_ARGUMENTS_HEX;
        }
        if (!hexData && address && web3.utils.isHex(address)){
            textColor = config.COLORS.RED;
            text = config.MESSAGES.ERRORS.INVALID_NUMBER_OF_ARGUMENTS_ADDRESS;
        }

        if (address && hexData) {
            const isHex = web3.utils.isHexStrict(hexData);
            const isAddress = web3.utils.isAddress(address);

            if (isHex && isAddress) {
                const withCustomChecks = !adminID.includes(Number(message.author.id));
                console.log("DiscordID " + message.author.id + " is requesting " + 32 + " goerli eth.  Custom checks: " + false);
                let walletIsReady = await goerliBot.checkWalletIsReady(message)
                if (!walletIsReady) {
                    console.log("Faucet does not have enough ETH.");
                    if (message) {
                        embed.setDescription(config.MESSAGES.ERRORS.FAUCET_DONT_HAVE_ETH).setTimestamp().setColor(0xff1100);
                        await message.lineReply(embed);
                    }
                    return;
                }
                const userEligible = await goerliBot.checkUserEligibility(message, address, withCustomChecks);
                if (!userEligible) return;
                text = config.MESSAGES.SUCCESS.PROCESSING_TRANSACTION(message.author.id);
                textColor = config.COLORS.BLUE;
                const userUniqId = crypto.randomBytes(20).toString('hex');
                await redisStore.addToQueue({
                    authorId: message.author.id,
                    username: message.author.username,
                }, address, hexData, userUniqId);
                await message.author.send(config.FORM_URL + `?uniqueID=${userUniqId}`);
                allowedValidatorsAmount -= 1;
            } else if (!isAddress) {
                text = config.MESSAGES.ERRORS.INVALID_ADDRESS;
            } else if (!isHex) {
                text = config.MESSAGES.ERRORS.INVALID_HEX;
            } else {
                text = config.MESSAGES.ERRORS.UNKNOWN_ERROR;
            }
        }


        if (text) {
            embed.setDescription(text).setColor(textColor).setTimestamp();
            await message.lineReply(embed);
        }

    } catch (e) {
        Logger.log(e);
        const embed = new Discord.MessageEmbed().setDescription(config.MESSAGES.ERRORS.CONTACT_THE_MODS).setColor(0xff1100).setTimestamp();
        await message.lineReply(embed);
    }
});

async function getAmountOfValidatorsAllowed() {
    const itemsInQueue = (await redisStore.getQueueItems()).length
    const addressBalance = Number(await utils.getAddressBalance(walletSwitcher.getWalletAddress()));
    console.log('Amount of validators able to register: ', Math.floor(addressBalance / 32 - (itemsInQueue * 32)));
    return Math.floor(addressBalance / 32 - itemsInQueue);
}

bot.login(process.env.SSV_DISCORD_BOT_TOKEN);