require('dotenv').config();

const Discord = require('discord.js')
const goerliBot = require('./goerliBot.js');
require('discord-reply');
const bot = new Discord.Client();
const web3 = require('web3');
require('./db');
const COMMAND_PREFIX = '+goerlieth';
const EMBEDDED_HELP_MESSAGE = {
  embed: {
    color: 3447003,
    title: "SSV Goerli Deposit Bot",
    description: "Welcome to the Deposit Bot for ssv.network Incentivezed Testnet.\n\n**Commands:**",
    fields: [{
        name: "+goerlieth <address> <hex-data>",
        value: "`To make a deposit you need to send HEX data + wallet address (on the Ethereum Launch Pad with MetaMask).`"
      },
      {
        name: "+goerlieth help",
        value: "`Help with the bot.`"
      },
      {
        name: "+goerlieth mod",
        value: "`Ping the admins for help if the BOT is malfunctioning (spamming this will result in a BAN!)`"
      }
      // {
      //   name: "+goerlieth add <address>",
      //   value: "`Adds your address to the database.`"
      // }
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
    // const addressExists = db.checkAddressExists(BigInt(message.author.id)).then(function (result){return result;})

    if (args[1].startsWith('0x')){
      if (!args[1] || !args[2]){
        embed.setDescription('**Error**\nInvalid number of arguments. Please try again.')
            .setColor(0xff1100).setTimestamp();
        message.lineReply(embed);
        return
      }
      const isAddress = web3.utils.isHexStrict(args[1]);
      const isHex = web3.utils.isHexStrict(args[2]);
      if (isHex && isAddress){
        bot.commands.get('goerliBot').execute(message, args, true);
        return
      } else if(!isAddress){
        embed.setDescription('**Error**\nInvalid `Address`.')
            .setColor(0xff1100).setTimestamp();
        message.lineReply(embed);
        return
      }else if (!isHex){
        embed.setDescription('**Error**\nInvalid `Hex`.')
            .setColor(0xff1100).setTimestamp();
        message.lineReply(embed);
        return
      }else{
        embed.setDescription('**Error**\nUnknown error occurred.')
            .setColor(0xff1100).setTimestamp();
        message.lineReply(embed);
        return
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
      // case 'add': {
      //   console.log('add address called')
      //   if (!args[2]){
      //     embed.setDescription("**Error**\nPlease provide an address to add, i.e. `+goerlieth add <your address>`");
      //     message.lineReply(embed);
      //     break;
      //   }
      //   if (web3.utils.isAddress(args[2]) && addressExists){
      //     db.addAddress(message.author.id, args[2]);
      //     embed.setDescription('**Operation Successful**\nYour address was recorded successfully!')
      //         .setColor(3447003).setTimestamp();
      //     message.lineReply(embed);
      //     return
      //   }else if (!web3.utils.isAddress(args[2])){
      //     embed.setDescription('**Error**\nPlease enter a valid address!')
      //         .setColor(0xff1100).setTimestamp();
      //     message.lineReply(embed);
      //     return
      //   }else if (addressExists){
      //     embed.setDescription('**Error**\nYour address is already added to the database.')
      //         .setColor(0xff1100).setTimestamp();
      //     message.lineReply(embed);
      //     return
      //   }
      //   break;
      // }
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
