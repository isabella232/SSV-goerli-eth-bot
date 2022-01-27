require('dotenv').config({path: '../.env'})
const abiDecoder = require('abi-decoder');
const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_HTTPS_ENDPOINT));
const Discord = require('discord.js');
const db = require('./db');
const contractABI = require('../contract-abi.json')
const { get } = require('http');

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

async function getGas(){
  let response = (await fetch(`https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=${process.env.ETHGAS_API_KEY}`)).json()
  return response.fastest
}


// Sending the goerli ETH
exports.sendGoerliEth = (address, prevMsg, message, faucetAddress, faucetKey, methodAbi, amount, nonce, latestGasPrice) => {
  console.log('Hex data: ')
  console.log(process.env.CONTRACT_ADDRESS, process.env.FAUCET_ADDRESS)

  const transaction = {
    from: process.env.FAUCET_ADDRESS,
    to: process.env.CONTRACT_ADDRESS,
    gas: 1000000,
    value: web3.utils.numberToHex(web3.utils.toWei(amount.toString(), 'ether')),
    data: methodAbi,
    gasPrice: latestGasPrice,
    chainID: 5,
    nonce,
  }

  web3.eth.accounts.signTransaction(transaction, process.env.FAUCET_PRIVATE_KEY)
      .then(signedTx => web3.eth.sendSignedTransaction(signedTx.rawTransaction))
      .then(receipt => {
        console.log("Sent to " + message.author.id + " transaction receipt: ", receipt)

        if (message) {
          let embed = new Discord.MessageEmbed()
              .setDescription(`**Operation Successful**\nSent **${amount} goerli ETH** to <@!${message.author.id}> - please wait a few minutes for it to arrive. To check the details at **etherscan.io**, click [here](https://goerli.etherscan.io/tx/${receipt.transactionHash})`)
              .setTimestamp().setColor(3447003);   //.setURL("https://goerli.etherscan.io/tx/" + receipt.transactionHash)
          prevMsg.edit(embed);          
          try {
            const decodedHexData = abiDecoder.decodeMethod(methodAbi);
            const pubKey = decodedHexData.params[0].value;
            db.addLog(message.author.id, message.author.username, pubKey,`https://goerli.etherscan.io/tx/${receipt.transactionHash}`, JSON.stringify(decodedHexData));
          } catch (e) {
            console.log(e);
          }
        }
      })
      .catch(err => {
        console.error("this is the error: " + err);
        throw err;
      });
}


// Validate faucet
exports.faucetIsReady = async (faucetAddress, amountRequested) => {
  const faucetBalance = await this.getAddressBalance(faucetAddress);
  console.log("Faucet Balance:",faucetBalance);
  const faucetBalanceNumber = Number(faucetBalance);
  const amountRequestedNumber = Number(amountRequested);
  return faucetBalanceNumber > amountRequestedNumber;
}

