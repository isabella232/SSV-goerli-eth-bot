require('dotenv').config({path: '../.env'})
const axios = require('axios');

let defaultGasPrice = 20;
async function getGasPrice(){
    try{
        return axios.get(`https://api-goerli.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY}`).then(
            function (result) {
                return result
            }
        )
    } catch {
        return 5
    }
}

async function init(){
    let gasPrice = (await getGasPrice()).data.result.FastGasPrice
    if (isNaN(gasPrice)){
        gasPrice = defaultGasPrice
    }
    console.log(Number(gasPrice))
}

init()
