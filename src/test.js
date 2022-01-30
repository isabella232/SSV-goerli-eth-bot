
const { ETHERSCAN_API_KEY, ETHERSCAN_API_URL, FAUCET_ADDRESS, GOERLI_API_URL } = process.env;
console.log(ETHERSCAN_API_KEY,GOERLI_API_URL)

const axios = require('axios');

async function getGasPrice(){
        const url = `https://api-goerli.etherscan.io/api
        ?module=gastracker&action=gasoracle&apikey==Y9Y41PJZ7KUJP3SVPZRZ29T99QEAJ434KZ`
        lastGasPrice =  (await axios.get(url))
        console.log(lastGasPrice)
        if (isNaN(lastGasPrice)){
            return "1500000000000"
        }
        return Number(lastGasPrice + '0000000000')
}
getGasPrice()
