require('dotenv').config({path: '../.env'})

const utils = require('./utils.js');
const Discord = require('discord.js');
const {getGasPrice} = require('./api.js');
const db = require('./db');
const Web3 = require('web3');
const { updateCounts } = require('./db');
const walletSwitcher = require('./initializers/WalletSwitcher');
new Web3(new Web3.providers.HttpProvider(process.env.INFURA_HTTPS_ENDPOINT));


const runCustomEligibilityChecks = async (discordID, address, topUpAmount) => {
  const res = await db.confirmTransaction(discordID, address, topUpAmount);
  console.log("Confirm Transaction result:",res);
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

const checkWalletIsReady = async () => {
  let walletIsReady = await utils.faucetIsReady(walletSwitcher.getWalletAddress(), 32);
  if (!walletIsReady && walletSwitcher.mainWallet) {
    console.log('<<<<<<<<<<<<Switche Wallet>>>>>>>>>>>>');
    walletSwitcher.switchToBackup(true);
    walletIsReady = await utils.faucetIsReady(walletSwitcher.getWalletAddress(), 32);
  }
  return walletIsReady;
}

// This runs once when imported (bot starting) to cache the nonce in a local file

module.exports = {
  // Make sure the bot has enough Goerli ETH to send
  checkWalletIsReady,
  checkUserEligibility: async (message, address, runCustomChecks = true) => {
    let embed = new Discord.MessageEmbed();
    const receiverEligible = await receiverIsEligible(message.author.id, address, 32, runCustomChecks);
    if (receiverEligible === null) {
      if (message) {
        embed.setDescription('**Error**\nSomething went wrong while confirming your transaction please try again.')
            .setTimestamp().setColor(3447003);
        await message.lineReply(embed);
      }
      return false;
    }
    if (receiverEligible === 401) {
      //Daily of goerli recieved
      const m = `**Operation Unsuccessful**\n<@!${message.author.id}> has reached their daily quota of goerliETH.`;
      console.log(m);
      if (message) {
        embed.setDescription(m)
            .setTimestamp().setColor(3447003);
        await message.lineReply(embed);
      }
      return false;
    }

    if (receiverEligible === 402) {
      //Weekly quota of goerli reached
      const m = `**Operation Unsuccessful**\n<@!${message.author.id}> has reached their weekly quota of goerliETH.`;

      console.log(m);

      if (message) {
        embed.setDescription(m)
            .setTimestamp().setColor(3447003);
        await message.lineReply(embed);
      }
      return false;
    }
    return true;
  },
  runGoerliFaucet: async function (message, address, hexData) {
    try {
      const walletIdReady = await checkWalletIsReady();
      if(!walletIdReady) {
        console.log('!!!!!!!!!!!!!!!!!!!!!Both wallet are empty!!!!!!!!!!!!!!!!!!!!!!!!!');
        return false;
      }
      const nonce = await utils.getNonce();
      const latestGasPrice = await getGasPrice();
      console.log('nonce: ' + nonce);
      console.log('latestGasPrice: ' + latestGasPrice);
      await utils.sendGoerliEth(address, message, hexData, 0.1, nonce, latestGasPrice);
      return true;
    } catch (e) {
      return false;
      console.log(e);
    }
  }
}
