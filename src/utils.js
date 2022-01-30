require('dotenv').config({path: '../.env'})
const abiDecoder = require('abi-decoder');
const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_HTTPS_ENDPOINT));
const Discord = require('discord.js');
const db = require('./db');
const contractABI = require('../contract-abi.json');
const { getGasPrice } = require('./api');
const {updateCounts} = require('./db')

abiDecoder.addABI(contractABI);


// Eth
exports.getAddressTransactionCount = async (address) => {
  const nonce = await web3.eth.getTransactionCount(address);
  return nonce;
}

exports.getAddressBalance = async (address) => {
  const balanceWei = await web3.eth.getBalance(address);
  return web3.utils.fromWei(balanceWei);
}


// Math
exports.incrementHexNumber = (hex) => {
  var intNonce = parseInt(hex, 16);
  var intIncrementedNonce = parseInt(intNonce+1, 10);
  var hexIncrementedNonce = '0x'+ intIncrementedNonce.toString(16);

  return hexIncrementedNonce;
}


// Nonce caching
exports.getCachedNonce = () => {
  return fs.readFileSync(process.env.NONCE_FILE, 'utf8');
}

exports.incrementCachedNonce = async () => {
  const currentNonce = this.getCachedNonce();
  const incrementedNonce = this.incrementHexNumber(currentNonce);

  this.setCachedNonce(incrementedNonce);
}

exports.initializeCachedNonce = async () => {
  const intNextNonceToUse = await this.getAddressTransactionCount(process.env.FAUCET_ADDRESS);
  const hexNextNonceToUse = '0x'+ intNextNonceToUse.toString(16);

  this.setCachedNonce(hexNextNonceToUse);
}

exports.setCachedNonce = (nonce) => {
  fs.writeFile(process.env.NONCE_FILE, nonce, function (err){
    if (err) throw err;
  })
}

// Sending the goerli ETH
exports.sendGoerliEth = (address, prevMsg, message, methodAbi, amount, nonce, latestGasPrice) => {
  console.log('Hex data: ')
  console.log(process.env.CONTRACT_ADDRESS, process.env.FAUCET_ADDRESS)
  console.log('gasPrice: ', latestGasPrice)

  const transaction = {
    from: process.env.FAUCET_ADDRESS,
    to: process.env.CONTRACT_ADDRESS,
    gas: 200000,
    value: web3.utils.numberToHex(web3.utils.toWei(amount.toString(), 'ether')),
    data: methodAbi,
    gasPrice: 1500000,
    chainID: 5,
    nonce,
  }
  while (true){
    var count = 0
    try {
      executeTx(message, transaction, methodAbi);
    }
    catch (e) {
      if (++count === 2){
        //send message to tell user to retry transaction and 
        prevMsg.edit(embed.setDescription(`**Error**\nTransaction could not be processed please try again.`).setColor(0xff1100).setTimestamp());
        updateCounts(message.author.id,-32);
      }
    }
    getGasPrice()
      .then( latestGasPrice => transaction.gasPrice = latestGasPrice);
  }


}


// Validate faucet
exports.faucetIsReady = async (faucetAddress, amountRequested) => {
  const faucetBalance = await this.getAddressBalance(faucetAddress);
  console.log("Faucet Balance:",faucetBalance);
  const faucetBalanceNumber = Number(faucetBalance);
  const amountRequestedNumber = Number(amountRequested);
  return faucetBalanceNumber > amountRequestedNumber;
}

function executeTx(prevMsg,message, transaction, methodAbi){
  let embed = new Discord.MessageEmbed()
  web3.eth.accounts.signTransaction(transaction, process.env.FAUCET_PRIVATE_KEY)
      .then(signedTx => web3.eth.sendSignedTransaction(signedTx.rawTransaction))
      .then(receipt => {
        console.log("Sent to " + message.author.id + " transaction receipt: ", receipt)

        if (message) {
          embed.setDescription(`**Operation Successful**\nSent **${32} goerli ETH** to <@!${message.author.id}> - please wait a few minutes for it to arrive. To check the details at **etherscan.io**, click [here](https://goerli.etherscan.io/tx/${receipt.transactionHash})`)
              .setTimestamp().setColor(3447003);   //.setURL("https://goerli.etherscan.io/tx/" + receipt.transactionHash)
          prevMsg.edit(embed);
        }

        try {
          const decodedHexData = abiDecoder.decodeMethod(methodAbi);
          const pubKey = decodedHexData.params[0].value;
          db.addLog(message.author.id, message.author.username, pubKey,`https://goerli.etherscan.io/tx/${receipt.transactionHash}`, JSON.stringify(decodedHexData))
              .then(result => {
                if (result === true) console.log("Tx Logged");
                else  console.error('Tx log failed');
              })
        } catch (e) {
          console.log(e);
        }
      })
      .catch(err => {
        console.error("this is the error: " + err);
        prevMsg.edit(embed.setDescription(`**Error**\n Transaction was not possible a`).setColor(0xff1100).setTimestamp())
        throw err;
      });
}