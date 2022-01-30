require('dotenv').config({path: '../.env'})

const utils = require('./utils.js');
const Discord = require('discord.js');
const {getGasPrice} = require('./api.js');
const db = require('./db');
const Web3 = require('web3');
new Web3(new Web3.providers.HttpProvider(process.env.INFURA_HTTPS_ENDPOINT));

const runCustomEligibilityChecks = async (discordID, address, topUpAmount) => {
  const res = await db.confirmTransaction(discordID, address, topUpAmount);
  console.log(res)
  return res

}

const receiverIsEligible = async (discordID, address, amountRequested, runCustomChecks)  => {
  const needsGoerliEth = true;
  if (runCustomChecks) {
    const passedCustomChecks = await runCustomEligibilityChecks(discordID, address, amountRequested);
    return needsGoerliEth && passedCustomChecks;
  } else {
    return needsGoerliEth;
  }
}

// This runs once when imported (bot starting) to cache the nonce in a local file
utils.initializeCachedNonce();

module.exports = {
  runGoerliFaucet: async (message, address, hexData, runCustomChecks) => {
    let embed = new Discord.MessageEmbed();
    console.log("DiscordID "+message.author.id +" is requesting " + 32 + " goerli eth.  Custom checks: " + runCustomChecks);

    // Make sure the bot has enough Goerli ETH to send
    const faucetReady = await utils.faucetIsReady(process.env.FAUCET_ADDRESS, 32);
    if (!faucetReady) {
      console.log("Faucet does not have enough ETH.");
      if (message) {
        embed.setDescription("**Operation Unsuccessful**\nThe Bot does not have enough Goerli ETH.  Please contact the maintainers.").
        setTimestamp().setColor(0xff1100);
        await message.lineReply(embed);
      }
      return;
    }

    const receiverEligible = await receiverIsEligible(message.author.id, address, 32, runCustomChecks);
    if (receiverEligible === null){
      if (message) {
        embed.setDescription('**Error**\nSomething went wrong while confirming your transaction please try again.')
            .setTimestamp().setColor(3447003);
        await message.lineReply(embed);
      }
      return;
    }
    if (receiverEligible === 401){
      //Daily of goerli recieved
      const m = `**Operation Unsuccessful**\n<@!${message.author.id}> has reached their daily quota of goerliETH.`;
      console.log(m);
      if (message) {
        embed.setDescription(m)
            .setTimestamp().setColor(3447003);
        await message.lineReply(embed);
      }
      return;
    }

    if (receiverEligible === 402){
      //Weekly quota of goerli reached
      const m = `**Operation Unsuccessful**\n<@!${message.author.id}> has reached their weekly quota of goerliETH.`;

      console.log(m);

      if (message) {
        embed.setDescription(m)
            .setTimestamp().setColor(3447003);
        await message.lineReply(embed);
      }
      return;
    }
    console.log("Checks passed - sending to " +  message.author.id);
    if (message) {
      embed.setDescription("**Operation Successful**\nChecks passed - sending...").
      setTimestamp().setColor(3447003);
    }
    let msg = await message.lineReply(embed);
    const nonce = utils.getCachedNonce();

    try {
      const latestGasPrice = await getGasPrice();
      await utils.sendGoerliEth(address, msg, message, hexData, 32, nonce, latestGasPrice);
    } catch (e) {
      console.log(e)
      if (message) {
        embed.setDescription("**Transaction Failed**\nPlease try again later.").
        setTimestamp().setColor(0xff1100);
      }
      await msg.edit(embed);
    }
    await utils.incrementCachedNonce();
  }
}
