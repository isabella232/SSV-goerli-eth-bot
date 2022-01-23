require('dotenv').config({path: '../.env'})

const utils = require('./utils.js');
const Discord = require('discord.js');
const etherscan = require('./api.js');
const db = require('./db.js');
const Web3 = require('web3');
const { max } = require('pg/lib/defaults');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_HTTPS_ENDPOINT));

const DEFAULT_GAS_PRICE = 1500000000000; // 1,500 gwei

const INELIGIBLE_NO_CUSTOM_CHECKS_MESSAGE = " is ineligible to receive goerli eth.";
const INELIGIBLE_CUSTOM_CHECKS_MESSAGE = " is ineligible to receive goerli eth.  You must pass the custom checks.";

const maxDepositAmount = Number(process.env.MAX_DEPOSIT_AMOUNT) 

const runCustomEligibilityChecks = async (hexData, topUpAmount) => {
  const res = await db.confirmTransaction(hexData, topUpAmount);
  console.log(res)
  return res

}

const receiverIsEligible = async (discordID, amountRequested, runCustomChecks)  => {
  const needsGoerliEth = true;
  if (runCustomChecks) {
    const passedCustomChecks = await runCustomEligibilityChecks(discordID, amountRequested);
    return needsGoerliEth && passedCustomChecks;
  } else {
    return needsGoerliEth;
  }
}

const runGoerliFaucet = async (message, hexData, runCustomChecks) => {
  let embed = new Discord.MessageEmbed();

  //Cannot check address balance

  //const currentBalance = await etherscan.getBalance(address);
  /*
  if (currentBalance === null) {
    console.log("Something went wrong while connecting to API to receive balance.");
    if (message) {
      embed.setDescription("**Error**\nSomething went wrong while getting hex details please try again.").
      setTimestamp().setColor(0xff1100);
      message.lineReply(embed)
    }
    return;
  }
  const topUpAmount = maxDepositAmount - (currentBalance);
  if(topUpAmount <= 0 ) {
    console.log("Given hex has max deposit amount.");

    if (message) {
      embed.setDescription("**Operation Unsuccessful**\nGiven Hex has max deposit amount.").
      setTimestamp().setColor(0xff1100);
      message.lineReply(embed);
    }
    return;
  }*/

  console.log("DiscordID " + message.author.id + " is requesting " + 32 + " goerli eth.  Custom checks: " + runCustomChecks);

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

  const receiverEligible = await receiverIsEligible(message.author.id, 32, runCustomChecks);
  if (receiverIsEligible === null){
    if (message) {
      embed.setDescription('**Error**\nSomething went wrong while confirming your transaction please try again.')
          .setTimestamp().setColor(3447003);
      await message.lineReply(embed);
    }
  }

  if (!receiverEligible) {
    const m = runCustomChecks ? `**Operation Unsuccessful**\n<@&${message.author.id}> + ${INELIGIBLE_CUSTOM_CHECKS_MESSAGE}`
        : `**Operation Unsuccessful**\n<@&${message.author.id}> + ${INELIGIBLE_NO_CUSTOM_CHECKS_MESSAGE}`;

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
    await message.lineReply(embed);
  }

  const nonce = utils.getCachedNonce();
  utils.sendGoerliEth(message, process.env.FAUCET_ADDRESS, process.env.FAUCET_PRIVATE_KEY, hexData, topUpAmount/Math.pow(10,18), nonce, DEFAULT_GAS_PRICE);
  
  await utils.incrementCachedNonce();
}

// This runs once when imported (bot starting) to cache the nonce in a local file
utils.initializeCachedNonce();

module.exports = {
  name: 'goerliBot',
  description: 'Sends goerli eth to the user.',
  execute(message, args, runCustomChecks = true) {
    runGoerliFaucet(message, args[1], runCustomChecks);
  }
} 

utils.initializeCachedNonce();

/*
runGoerliFaucet({ author: {
  id: 419238541009092650
}}, "0x22895118000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012016d50bc4caa3c8fadd8d37cfcfcf25d69f73b4324ce54c99c7635b19922a5a400000000000000000000000000000000000000000000000000000000000000030b4de6a58cb0585a52e12b2ecba4a6784934819188ff4c2bce1dd705a0f8c530883dbf507e6dd83cafa0df3555e0b5ee7000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020008494155aba626d93e24a1de2c983e5376ab9e3507fe2b2b671337b1e30d8dd0000000000000000000000000000000000000000000000000000000000000060aff68160310f4fa9975bf5841f2312eaaea73d35bdaa737ed888e368f2215d4bcbf31bff74c4e2626d2845820f25032b129b2f022b6df86c26e8896f016ad17880c215ebf1ecdba693c56f5aae4437154bd7c108b8fc4c32a08fedd1d1e9bcf2", true);
*/