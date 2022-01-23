require('dotenv').config();

const Discord = require('discord.js')
const goerliBot = require('./goerliBot.js');
require('discord-reply');
const bot = new Discord.Client();
const web3 = require('web3');
const db = require('./db')

const COMMAND_PREFIX = '+goerlieth';
const EMBEDDED_HELP_MESSAGE = {
  embed: {
    color: 3447003,
    title: "Goerli ETH Bot",
    description: "Welcome to the GoErli ETH Faucet. Following are my commands:",
    fields: [{
        name: "+goerlieth <hex-data>",
        value: "`Sends up to 32 goerli ETH to the specified Hex. \n\nEx: +goerlieth <hex-data>`"
      },
      {
        name: "+goerlieth help",
        value: "`Shows this message.`"
      },
      {
        name: "+goerlieth mod",
        value: "`Tags the maintainers of this bot, please use if you are experiencing any issues.`"
      },
      {
        name: "+goerlieth add <address>",
        value: "`Adds your address to the database.`"
      }
    ]
  }
}

let yourBotToken = process.env.DISCORD_BOT_TOKEN;
bot.login(yourBotToken);
bot.commands = new Discord.Collection();
bot.commands.set(goerliBot.name, goerliBot);

bot.on('ready', () => {
  console.log('I am ready!');
});

bot.on('message', (message) => {
  try {
    if (!message || message.length === 0 || message.content.substring(0, COMMAND_PREFIX.length) !== COMMAND_PREFIX) {
      return;
    }

    let embed = new Discord.MessageEmbed()

    const args = message.content.substring(COMMAND_PREFIX.length).split(" ")

    console.log('Check address exists for this id: ', db.checkAddressExists(BigInt(message.author.id)));
    console.log('isHexStrict: ', web3.utils.isHexStrict(args[1]));

    if (args[1].startsWith('0x')){
      if (web3.utils.isHexStrict(args[1])){
        if (db.checkAddressExists(BigInt(message.author.id))){
          bot.commands.get('goerliBot').execute(message, args, true);
        }else if (!db.checkAddressExists(BigInt(message.author.id))){
          embed.setDescription('**Error**\nPlease add your address first using `+goerlieth add <address>`.')
              .setColor(0xff1100).setTimestamp();
          message.lineReply(embed);
        }
      }else if (web3.utils.isAddress(args[1])){
        embed.setDescription('**Error**\nPlease use hex data, not your address. Refer to the guide on how to get hex data.')
            .setColor(0xff1100).setTimestamp();
        message.lineReply(embed);
      }else{
        embed.setDescription('**Error**\nInvalid `Hex`. Please try again.')
            .setColor(0xff1100).setTimestamp();
        message.lineReply(embed);
      }
    }

    switch(args[1]){
      // Faucet commands
      case 'null': {
        embed.setDescription('**Error**\nUse `+goerlieth help` for the list of commands!')
            .setColor(0xff1100).setTimestamp();
        message.lineReply(embed);
        break;
      }
      // Other commands
      case 'help': {
        console.log("help called");
        message.lineReply(EMBEDDED_HELP_MESSAGE);
        break;
      }
      case 'add': {
        console.log('add address called')
        if (!args[2]){
          embed.setDescription("**Error**\nPlease provide an address to add, i.e. `+goerlieth add <your address>`");
          message.lineReply(embed);
          break;
        }
        if (web3.utils.isAddress(args[2]) && !db.checkAddressExists(BigInt(message.author.id))){
          db.addAddress(message.author.id, args[2]);
          embed.setDescription('**Operation Successful**\nYour address was recorded successfully!')
              .setColor(3447003).setTimestamp();
          message.lineReply(embed);
        }else if (!web3.utils.isAddress(args[2])){
          embed.setDescription('**Error**\nPlease enter a valid address!')
              .setColor(0xff1100).setTimestamp();
          message.lineReply(embed);
        }else{
          embed.setDescription('**Error**\nYour address is already added to the database.')
              .setColor(0xff1100).setTimestamp();
          message.lineReply(embed);
        }
        break;
      }
      case 'mod': {
        // Tag the moderators
        console.log("mod called");
        // Uncomment below and add discord ids if you'd like to be tagged
        embed.setDescription('**Alerting the Administrators**\n <@&723840404159594496> come check this out!')
            .setColor(3447003).setTimestamp();
        message.lineReply(embed);
        break;
      }
      // For fun :)
      case 'dance': {
        console.log("dance called");
        embed.setImage('https://c.tenor.com/fJh-W38iA3oAAAAM/dance-kid.gif').setColor(3447003).setTimestamp();
        message.lineReply(embed);
        break;
      }
    }
  } catch (e) {
    console.log(e);
    let embed = new Discord.MessageEmbed().setDescription('**Error**\nSomething went wrong. If this continues,' +
        ' please contact the mods of this bot by using command: `!mod`').setColor(0xff1100).setTimestamp();
    message.lineReply(embed);
  }
});
