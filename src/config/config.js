const config = {
    CHANNEL_ID: '937433019181064252',
    VERIFIED_ROLE_ID: '936274576801923163',
    MESSAGES: {
        MODE: {
            MOD: '**Alerting the Administrators**\n <@&723840404159594496> come check this out!',
            HELP: 'Welcome to the Deposit Bot for **ssv.network Primus Testnet**.\nThis **BOT** will make a **32 goerli** deposit to your validator.\n\n**BOT rules:**\n**1.**\nOne message can be sent every 6 hours, please make sure to read and understand how the bot works before you continue.\n**2.**\n Each user is entitled to 1 deposit per 24 hours.\n**3.**\nTrying to abuse the bot will result in a **ban**, **disqualification** from the testnet and **block**.\n\n**To generate HEX data for your deposit:**\n**1.**\nGet to the validator deposit stage on: https://prater.launchpad.ethereum.org/en/overview and change `disabled` to `enabled` by `inspecting` the button (on the launchpad page)https://i.imgur.com/izYw5QU.gif\n**2.**\n On the send deposit page - once Metamask is open, open the Data page and copy the Hex Data. https://i.imgur.com/2XGOT9H.gif. Now move to Discord Bot Channel.\n\n**Guide:**',
        },
        ERRORS: {
            INVALID_HEX: '**Error**\nInvalid `Hex`.',
            INVALID_ADDRESS: '**Error**\nInvalid `Address`.',
            UNKNOWN_ERROR: '**Error**\nUnknown error occurred.',
            NO_ADDRESS: '**Error**\nNo arguments provided. Please check the guide.',
            INVALID_NUMBER_OF_ARGUMENTS_HEX: '**Error**\nInvalid number of arguments. Please provide your `hex` **after** the `address`.',
            SOMETHING_WENT_WRONG_RECEIVER_ELIGIBLE: '**Error**\nSomething went wrong while confirming your transaction please try again.',
            FAUCET_DONT_HAVE_ETH: '"**Operation Unsuccessful**\nThe Bot does not have enough Goerli ETH.  Please contact the maintainers."',
            CONTACT_THE_MODS: '**Error**\nSomething went wrong. If this continues, please contact the mods of this bot by using command: `!mod`',
            INVALID_NUMBER_OF_ARGUMENTS_ADDRESS: '**Error**\nInvalid number of arguments. Please provide your `address` **first** then your `hex`.',
            REACHED_DAILY_GOERLI_ETH: (authorId) => {return `**Operation Unsuccessful**\n<@!${authorId}> has reached their daily quota of goerliETH.`},
        },
        SUCCESS: {
            PROCESSING_TRANSACTION: (authorId) => {return `\n<@!${authorId}>** Processing Transaction**`},
            OPERATION_SUCCESSFUL: (authorId) => {return `**Operation Successful**\nSent **32 goerli ETH** to \n<@!${authorId}>`},
        },
    },
};
module.exports = config;
