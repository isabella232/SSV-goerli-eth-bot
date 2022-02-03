const axios = require('axios');
const utils = require('./utils');
const rateLimit = require('axios-rate-limit');
require('dotenv').config({path: '../.env'})
const { SSV_ETHERSCAN_API_KEY, SSV_ETHERSCAN_API_URL, SSV_FAUCET_ADDRESS, SSV_GOERLI_API_URL } = process.env;
const request = rateLimit(axios.create(), {maxRequests: 5, perMillisecondss: 500})
const maxTries = 3;

const getBlockNumber = async function(time) {
    const url = `${SSV_ETHERSCAN_API_URL}?module=block&action=getblocknobytime&timestamp=${time}&closest=before&apikey=${SSV_ETHERSCAN_API_KEY}`
    return (await (request.get(url))).data.result;
}
const getTransactions = async function (address, fromBlock) {
    const url = `${SSV_ETHERSCAN_API_URL}?module=account&action=txlist&address=${address}&startblock=${fromBlock}&endblock=latest&sort=desc&apikey=${SSV_ETHERSCAN_API_KEY}`
    const res = await request.get(url)
    return res.data.result;
}


module.exports = {
    checkDeposit: async function(address) {
        let count = 0
        while (true) {
            try {
                let time = new Date();
                time.setDate(time.getDate() - 2);
                const fromBlock = await getBlockNumber(Math.floor(time.getTime()/1000))
                let depositedTxArray = []
                const tx = await getTransactions(address, fromBlock);
                if (tx) {
                    for (count = 0; count < tx.length; count++){
                        if (tx[count].to === SSV_FAUCET_ADDRESS.toLowerCase()) {
                            depositedTxArray.push({hash: tx[count].hash, amount: tx[count].value});
                        }
                    }
                }
                return depositedTxArray;
            } catch (e) {
                if (++count == maxTries) return null;
            }
        }

    },
    getBalance: async function (address){
        let count = 0;
        while (true){
            try {
                //const request = await rateLimit(axios.create(), {maxRequests: 5, perMillisecondss: 1000, maxRPS: 1});
                const url = `${ SSV_GOERLI_API_URL }?module=account&action=balance&address=${address}&tag=latest&apikey=${SSV_ETHERSCAN_API_KEY}`;
                return (await request.get(url)).data.result;
            } catch (e) {
                if (++count == maxTries) return null;
            }
        }
    },
    getGasPrice: async function(){
        try{
            const url = `${SSV_GOERLI_API_URL}?module=gastracker&action=gasoracle&apikey=${process.env.SSV_ETHERSCAN_API_KEY}`
            let lastGasPrice =  (await axios.get(url)).data.result.FastGasPrice
            if (isNaN(lastGasPrice)){
                return 990000000000
            }

            return await utils.convertToWei(lastGasPrice);
        }
        catch (e) {
            return 990000000000
        }
    }
}