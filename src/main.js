require('discord-reply');
require('dotenv').config();
require('./db');
const web3 = require('web3');
const redisStore = require('./redis');
const Logger = require('./logger.js');
const Discord = require('discord.js');
const goerliBot = require('./goerliBot.js');
const bot = require('./initializers/DiscordBot');
const queueHandler = require('./queueHandler.js');

const textColor = 0xff1100;
const COMMAND_PREFIX = '+goerlieth';
const title = 'SSV Goerli Deposit Bot';
const adminID = [695568381591683162, 636950487089938462, 836513795194355765, 844110609142513675, 724238721028980756, 135786298844774400]

const EMBEDDED_HELP_MESSAGE = new Discord.MessageEmbed().setTitle(title).setColor(3447003)
    .setDescription("Welcome to the Deposit Bot for **ssv.network Incentivezed Testnet**.\nThis **BOT** will make a **32 goerli** deposit to your validator.\n\n**BOT rules:**\n**1.**\nOne message can be sent every 6 hours, please make sure to read and understand how the bot works before you continue.\n**2.**\n Each user is entitled to 1 deposit per 24 hours.\n**3.**\nTrying to abuse the bot will result in a **ban**, **disqualification** from the testnet and **block**.\n\n**To generate HEX data for your deposit:**\n**1.**\nGet to the validator deposit stage on: https://prater.launchpad.ethereum.org/en/overview and change `disabled` to `enabled` by `inspecting` the button (on the launchpad page)https://i.imgur.com/izYw5QU.gif\n**2.**\n On the send deposit page - once Metamask is open, open the Data page and copy the Hex Data. https://i.imgur.com/2XGOT9H.gif. Now move to Discord Bot Channel.\n\n**Guide:**")
    .addField("+goerlieth <address> <hex-data>", 'To start you need to register the **wallet address** you used to generate the **hex** and the **hex** itself.')
    .addField("+goerlieth help", 'Help with the bot.')
    .addField("+goerlieth mod", "Ping the admins for help if the **BOT** is malfunctioning (spamming this will result in a **BAN**)")

bot.on('ready', async function () {
    queueHandler.executeQueueList();
    Logger.log('I am ready!');
})

bot.on('message', async function (message) {
    try {
        if (!message || !message.content || message.content.substring(0, COMMAND_PREFIX.length) !== COMMAND_PREFIX) return;

        let text = '';
        const embed = new Discord.MessageEmbed()
        const args = (message.content.substring(COMMAND_PREFIX.length).split(/ |\n/)).filter(n => n)
        const address = args[0];
        const hexData = args[1];

        // check if user request other commands
        if (address === 'help') {
            const attachment = new Discord.MessageAttachment('./src/img.png', 'img.png');
            EMBEDDED_HELP_MESSAGE.attachFiles(attachment).setImage('attachment://img.png');
            await message.lineReply(EMBEDDED_HELP_MESSAGE);
        }

        // check user's params
        if (address === 'mod') text = '**Alerting the Administrators**\n <@&723840404159594496> come check this out!'
        if (!address) text = '**Error**\nNo arguments provided. Please check the guide.';
        if (!hexData && address && web3.utils.isAddress(address)){
            text = '**Error**\nInvalid number of arguments. Please provide your `hex` **after** the `address`.';
        } else if (!hexData && address && web3.utils.isHex(address)) {
            text = '**Error**\nInvalid number of arguments. Please provide your `address` **first** then your `hex`.';
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
                        embed.setDescription("**Operation Unsuccessful**\nThe Bot does not have enough Goerli ETH.  Please contact the maintainers.").setTimestamp().setColor(0xff1100);
                        await message.lineReply(embed);
                    }
                    return;
                }
                const userEligible = await goerliBot.checkUserEligibility(message, address, withCustomChecks);
                if (!userEligible) return;
                text = `\n<@!${message.author.id}>** Processing Transaction**`
                await redisStore.addToQueue({
                    authorId: message.author.id,
                    username: message.author.username
                }, address, hexData);
            }
        } else if (!isAddress) {
            text = '**Error**\nInvalid `Address`.';
        } else if (!isHex) {
            text = '**Error**\nInvalid `Hex`.';
        } else {
            text = '**Error**\nUnknown error occurred.';
        }


        if(text) {
            embed.setDescription(text).setColor(textColor).setTimestamp();
            await message.lineReply(embed);
        }

    } catch (e) {
        Logger.log(e);
        const embed = new Discord.MessageEmbed().setDescription('**Error**\nSomething went wrong. If this continues,' +
            ' please contact the mods of this bot by using command: `!mod`').setColor(0xff1100).setTimestamp();
        await message.lineReply(embed);
    }
});
bot.login(process.env.SSV_DISCORD_BOT_TOKEN);