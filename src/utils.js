require('dotenv').config();

const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_HTTPS_ENDPOINT));
const Discord = require('discord.js');

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
exports.sendGoerliEth = (message, faucetAddress, faucetKey, methodAbi, amount, nonce, gasPrice) => {
  console.log("In sendGoerliETH", faucetAddress, faucetKey, methodAbi);
  //const methodAbi = process.env.METHOD_ABI

  const transaction = {
    from: process.env.FAUCET_ADDRESS,
    to: process.env.CONTRACT_ADDRESS,
    gas: 100000,
    value: web3.utils.numberToHex(web3.utils.toWei(amount.toString(), 'ether')),
    data: methodAbi,
    gasPrice: 1500000000000,
    chainID: 5,
    nonce,
  }

  web3.eth.accounts.signTransaction(transaction, process.env.FAUCET_PRIVATE_KEY)
      .then(signedTx => web3.eth.sendSignedTransaction(signedTx.rawTransaction))
      .then(receipt => {
        console.log("Sent to " + receiverAddress + " transaction receipt: ", receipt)

        if (message) {
          let embed = new Discord.MessageEmbed()
              .setDescription(`"**Operation Successful**\nSent ${amount} goerli ETH to ${receiverAddress}
         - please wait a few minutes for it to arrive.
          [Click here, to check the details at etherscan.io.]
          (https://goerli.etherscan.io/tx/${receipt.transactionHash})`).setTimestamp().setColor(3447003);   //.setURL("https://goerli.etherscan.io/tx/" + receipt.transactionHash)
          message.lineReply(embed);
          let dataToWrite = `${message.author.id},${new Date()},${hexData},${receipt.transactionHash},https://goerli.etherscan.io/tx/${receipt.transactionHash},\n`;
          fs.writeFile('txRecords/records.csv', dataToWrite, 'utf8', function (err) {
            if (err) {
              console.log('Some error occurred - file either not saved or corrupted file saved.');
            } else{
              console.log('Successfully written records to CSV file!');
            }
          });
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