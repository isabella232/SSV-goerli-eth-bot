require('dotenv').config({path: '../.env'})

const utils = require('./utils.js');
const Discord = require('discord.js');
const {getGasPrice} = require('./api.js');
const db = require('./db');
const Web3 = require('web3');
const { max } = require('pg/lib/defaults');
new Web3(new Web3.providers.HttpProvider(process.env.INFURA_HTTPS_ENDPOINT));
const adminID = [(695568381591683162), (636950487089938462), (844110609142513675), (724238721028980756), (135786298844774400)]

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

const runGoerliFaucet = async (message, address, hexData, runCustomChecks) => {
  let embed = new Discord.MessageEmbed();
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
    await utils.sendGoerliEth(address, msg, message, process.env.FAUCET_ADDRESS, process.env.FAUCET_PRIVATE_KEY, hexData, 32, nonce, latestGasPrice);
  } catch (e) {
    console.log(e)
    if (message) {
      embed.setDescription("**Transaction Failed**\nPlease try again later").
      setTimestamp().setColor(0xff1100);
    }
    await msg.edit(embed);
  }
  await utils.incrementCachedNonce();
}

// This runs once when imported (bot starting) to cache the nonce in a local file
utils.initializeCachedNonce();

module.exports = {
  name: 'goerliBot',
  description: 'Sends goerli eth to the user.',
  execute(message, args, runCustomChecks = true) {
    if (adminID.includes(Number(message.author.id))){
      runGoerliFaucet(message, args[0], args[1], false);
    }else{
      runGoerliFaucet(message, args[0], args[1], runCustomChecks);
    }
  }
} 

utils.initializeCachedNonce();

/*
runGoerliFaucet({ author: {
  id: 419238541009092650
}}, "0x22895118000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012016d50bc4caa3c8fadd8d37cfcfcf25d69f73b4324ce54c99c7635b19922a5a400000000000000000000000000000000000000000000000000000000000000030b4de6a58cb0585a52e12b2ecba4a6784934819188ff4c2bce1dd705a0f8c530883dbf507e6dd83cafa0df3555e0b5ee7000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020008494155aba626d93e24a1de2c983e5376ab9e3507fe2b2b671337b1e30d8dd0000000000000000000000000000000000000000000000000000000000000060aff68160310f4fa9975bf5841f2312eaaea73d35bdaa737ed888e368f2215d4bcbf31bff74c4e2626d2845820f25032b129b2f022b6df86c26e8896f016ad17880c215ebf1ecdba693c56f5aae4437154bd7c108b8fc4c32a08fedd1d1e9bcf2", true);
*/