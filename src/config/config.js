const config = {
    VERIFIED_ROLE_ID: '936274576801923163',
    FORM_URL: process.env.SSV_FORM_URL,
    CHANNEL_ID: process.env.SSV_DISCORD_BOT_CHANNEL,
    SHEET_REPLY_CHANNEL: process.env.SSV_SHEET_REPLY_CHANNEL,
    COLORS: {
        BLUE: 3447003,
        RED: 0xff1100,
    },
    MESSAGES: {
        MODE: {
            MOD: '**Alerting the Administrators**\n <@&723840404159594496> come check this out!',
            HELP: `**SSV Goerli Deposit Bot**\n Welcome to the Deposit Bot for ssv.network Primus Testnet.\n This BOT will make a 32 goerlieth deposit to your validator.\n **BOT rules:**\n **1.** Each user is entitled to 1 deposit per 24 hours.\n **2.** Only the wallet registering the validator to the ssv.network is eligible to participate using the bot.\n **3.** If you made a deposit before but failed to register the validator with the same wallet to the\n ssv.network the bot will not accept your request.\n **4.** There will be 2 cycles a day with about 1-hour announcement in advance (in this channel) once in\n the morning and again about 5-8 hours later UTC+2\n **5.** In each cycle the deposit channel may open and close a few times according to the number of\n requests in the queue and the cycle is officially ended when the list of successful deposit of the cycle is\n announced.\n **6.** If your command was valid you will get a DM from the bot with a link to a form where you need to\n answer correctly.\n (NOTE that having filled the form doesn't mean you already claimed the deposits. If you failed to fill it\n before the cycle threshold has been reached you will not be deposited).\n **7.** At the end of the cycle, a list of Discord users who have been deposited will be announced on\n Discord.\n **8.** Trying to abuse the bot will result in a ban, disqualification from the testnet, and block.\n **9.** Slow mode is enabled and set to 6 hours.\n **To generate HEX data for your deposit:**\n **1.** Get to the validator deposit stage on: https://prater.launchpad.ethereum.org/en/overview and\n change disabled to enabled by inspecting the button (on the launchpad\n page)https://i.imgur.com/izYw5QU.gif\n\n **2.** On the send deposit page - once Metamask is open, open the Data page and copy the Hex Data.\n https://i.imgur.com/2XGOT9H.gif. Now move to Discord Bot Channel.\n\n **Command Guide:**\n Deposit command: (:warning:**remember!**:warning: you have to use the same wallet address used for\n BOTH creating the HEX and registering the validator later on the ssv.network web app).\n +goerlieth <address> <hex-data> BOT Guide: +goerlieth help`,
        },
        ERRORS: {
            INVALID_HEX: '**Error**\nInvalid `Hex`.',
            INVALID_ADDRESS: '**Error**\nInvalid `Address`.',
            UNKNOWN_ERROR: '**Error**\nUnknown error occurred.',
            WRONG_HEX: (authorId) => { return '**Error**\n<@!${authorId}> Transaction failed, please try again.'},
            ADDRESS_IS_NOT_ELIGIBLE: `**Error!**\nPlease make sure you used the command properly. To view the BOT guide use: +goerlieth help`,
            INVALID_NUMBER_OF_ARGUMENTS_HEX: '**Error**\nInvalid number of arguments. Please provide your `hex` **after** the `address`.',
            SOMETHING_WENT_WRONG_RECEIVER_ELIGIBLE: '**Error**\nSomething went wrong while confirming your transaction please try again.',
            FAUCET_DONT_HAVE_ETH: '"**Operation Unsuccessful**\nThe Bot does not have enough Goerli ETH. Please contact the maintainers."',
            CONTACT_THE_MODS: '**Error**\nSomething went wrong. If this continues, please contact the mods of this bot by using command: `!mod`',
            INVALID_NUMBER_OF_ARGUMENTS_ADDRESS: `**Error!**\nPlease make sure you used the command properly. To view the BOT guide use: +goerlieth help`,
            REACHED_DAILY_GOERLI_ETH: (authorId) => {return `**Error**\n<@!${authorId}> have reached your daily limit. To view the BOT guide use: +goerlieth help`},
            END_OF_CYCLE: `**Cycle Ended**\nTo read more about how the Deposit BOT work head here: https://discord.com/channels/936177490752319539/936275762942709800/938475017509957653 **See you in the next cycle!**`,
        },
        SUCCESS: {
            PROCESSING_TRANSACTION: (authorId) => {return `**Success!** \n<@!${authorId}> Processing Transaction. Check back in a few minutes.`},
            OPERATION_SUCCESSFUL: (authorId, txHash) => {return `**Operation Successful**\nSent **32 goerli ETH** to \n<@!${authorId}> please wait a few minutes for it to arrive. To check the details at etherscan.io, click https://goerli.etherscan.io/tx/${txHash}`},
        },
    },
};
module.exports = config;
