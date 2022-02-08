const redisStore = require('../redis');
const config = require("../config/config");
const discordBot = require('./DiscordBot');
require('dotenv').config();

class DirectMessage {
    constructor() {
        setTimeout(()=>{
            this.sendRequests();
        },2000)
    }

    addToQueue = async (message, userUniqId) => {
        await redisStore.client.set(`direct_message_item_${userUniqId}`, JSON.stringify(message));
    };

    removeAll = async () => {
        const itemsList = await redisStore.client.keys(`direct_message_item_*`);
        for (let i in itemsList) {
            await redisStore.client.del(i)
        }
    };

    sendRequests = async () => {
        const itemsList = await redisStore.client.keys(`direct_message_item_*`);
        const batchArray = itemsList.slice(0, 50);
        for(let i of batchArray) {
            const uniqId = i.split("direct_message_item_").pop();
            const item = JSON.parse(await redisStore.client.get(i));
            const user = await discordBot.users.fetch(item.authorID, false)
            try {
                await user.send(config.FORM_URL + `?uniqueID=${uniqId}`);
                console.log('<Send Message>', `message to ${uniqId}`);
            } catch (e) {
                console.log(`fail to send message to ${uniqId}`);
            }
            await redisStore.removeFromQueue(`direct_message_item_${uniqId}`)
            await this.sleep(10000);
        }
        this.sendRequests();
    };

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const directMessage = new DirectMessage();

module.exports = directMessage;