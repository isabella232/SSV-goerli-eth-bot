require('dotenv').config();

const Discord = require('discord.js');
const goerliBot = require('./goerliBot.js');
require('discord-reply');
const bot = new Discord.Client();
const web3 = require('web3');

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

function prefix0x(hex){
  if (!hex.startsWith('0x')){
    return `0x${hex}`
  }else{
    return hex
  }
}

bot.on('message', (message) => {
  try {
    if (!message || message.length === 0 || message.content.substring(0, COMMAND_PREFIX.length) !== COMMAND_PREFIX) {
      return;
    }

    let embed = new Discord.MessageEmbed()

    const args = message.content.substring(COMMAND_PREFIX.length).split(" ")

    if (web3.utils.isHexStrict(prefix0x(args[1]))){
      bot.commands.get('goerliBot').execute(message, args, true);
    }else{
      embed.setDescription('**Error**\nInvalid `Hex`. Please double check.')
          .setColor(0xff1100).setTimestamp();
      message.lineReply(embed);
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
