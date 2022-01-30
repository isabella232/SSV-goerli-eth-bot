const { GasPriceOracle } = require('gas-price-oracle');

const options = {
        chainId: 1,
        defaultRpc: 'https://api.mycryptoapi.com/eth',
        timeout: 10000,
        defaultFallbackGasPrices: {
                instant: 28,
                fast: 22,
                standard: 17,
                low: 11,
        },
};
const oracle = new GasPriceOracle(options);
// optional fallbackGasPrices
const fallbackGasPrices = {
        instant: 70,
        fast: 31,
        standard: 20,
        low: 7,
};
oracle.gasPrices(fallbackGasPrices).then(gasPrices => {
        console.log(gasPrices); // { instant: 50, fast: 21, standard: 10, low: 3 }
});