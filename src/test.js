require('dotenv').config({path: '../.env'})
const axios = require('axios');


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
    let gasPrice = (await getGasPrice())
    console.log(Number(gasPrice.data.result.FastGasPrice))
}

init()
