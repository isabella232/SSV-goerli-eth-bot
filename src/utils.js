const db = require('./db');
const Web3 = require('web3');
const Discord = require('discord.js');
const abiDecoder = require('abi-decoder');
const config = require('./config/config');
require('dotenv').config({path: '../.env'})
const bot = require("./initializers/DiscordBot");
const contractABI = require('../contract-abi.json');
const walletSwitcher = require('./initializers/WalletSwitcher');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.SSV_INFURA_HTTPS_ENDPOINT));

abiDecoder.addABI(contractABI);

// Validate faucet
const faucetIsReady = async (faucetAddress, amountRequested) => {
    const faucetBalance = await getAddressBalance(faucetAddress);
    console.log("Faucet Balance:", faucetBalance);
    const faucetBalanceNumber = Number(faucetBalance);
    const amountRequestedNumber = Number(amountRequested);
    return faucetBalanceNumber > amountRequestedNumber;
}

const convertToWei = async (amount) => {
    return web3.utils.toWei(amount, 'gwei');
};

// Eth
const getAddressTransactionCount = async (address) => {
    return await web3.eth.getTransactionCount(address);
}

const getAddressBalance = async (address) => {
    const balanceWei = await web3.eth.getBalance(address);
    return web3.utils.fromWei(balanceWei);
}

// Math
const incrementHexNumber = (hex) => {
    const intNonce = parseInt(hex, 16);
    const intIncrementedNonce = parseInt(intNonce + 1, 10);
    return '0x' + intIncrementedNonce.toString(16);
}

const getNonce = async () => {
    const intNextNonceToUse = await getAddressTransactionCount(walletSwitcher.getWalletAddress());
    return '0x' + intNextNonceToUse.toString(16);
}

// Sending the goerli ETH
const sendGoerliEth = async (address, message, methodAbi, amount, nonce, latestGasPrice) => {
    console.log("Inside sendGoerliETH sending tx...")
    console.log('gasPrice:', latestGasPrice)

    const transaction = {
        from: walletSwitcher.getWalletAddress(),
        to: '0x45E668aba4b7fc8761331EC3CE77584B7A99A51A' || process.env.SSV_CONTRACT_ADDRESS,
        gas: 1000000,
        value: web3.utils.numberToHex(web3.utils.toWei(amount.toString(), 'ether')),
        data: methodAbi,
        gasPrice: latestGasPrice,
        chainID: 5,
        nonce,
    }

    try {
        const embed = new Discord.MessageEmbed();
        const signedTx = await web3.eth.accounts.signTransaction(transaction, walletSwitcher.getWalletPrivateKey());
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log("Sent to " + message.authorId + " transaction receipt: ", receipt);
        try {
            const decodedHexData = abiDecoder.decodeMethod(methodAbi);
            const pubKey = decodedHexData.params[0].value;
            const result = await db.addLog(message.authorId, message.username, pubKey, `https://goerli.etherscan.io/tx/${receipt.transactionHash}`, JSON.stringify(decodedHexData))
            if (result === true) console.log("Tx Logged");
            if (message.authorId) {
                const channel = bot.channels.cache.find(channel => channel.id === config.CHANNEL_ID)
                if (channel) {
                    embed.setDescription(config.MESSAGES.SUCCESS.OPERATION_SUCCESSFUL(message.authorId, receipt.transactionHash)).setTimestamp().setColor(3447003);
                    channel.send(embed)
                }
            } else console.error('Tx log failed');
        } catch (e) {
            console.log(e);
            console.log("Counld not log transaction.");
        }
    } catch (err) {
        console.log('<<<<<<<<<<<<<<<<<<<<<<<<<calculate new nonce>>>>>>>>>>>>>>>>>>>>>>>>>');
        console.log(err);
        const newNone = await getNonce();
        await sendGoerliEth(address, message, methodAbi, amount, newNone, latestGasPrice);
    }
}

module.exports = {
    getNonce,
    convertToWei,
    faucetIsReady,
    sendGoerliEth,
    getAddressBalance,
    incrementHexNumber,
    getAddressTransactionCount
};

