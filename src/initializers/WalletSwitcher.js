require('dotenv').config();

class WalletSwitcher {
    constructor() {
        this.mainWallet = true;
    }

    switchToBackup = (status) => {
      this.mainWallet = !status;
    };

    getWalletAddress = () => {
        if(this.mainWallet) return process.env.SSV_FAUCET_ADDRESS
        return process.env.SSV_FAUCET_ADDRESS_2
    };

    getWalletPrivateKey = () => {
        if(this.mainWallet) return process.env.SSV_FAUCET_PRIVATE_KEY
        return process.env.SSV_FAUCET_PRIVATE_KEY_2
    };
}

const walletSwitcher = new WalletSwitcher();

module.exports = walletSwitcher;