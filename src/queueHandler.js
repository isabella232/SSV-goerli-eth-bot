require('dotenv').config();
const redisStore = require('./redis');
const goerliBot = require('./goerliBot.js');

class QueueHandler {
    constructor(redisStore) {
        this.redisStore = redisStore;
    }

    executeQueueList = async () => {
        const itemsKeys = await this.redisStore.client.keys('queue_item_*')
        itemsKeys.sort((a,b) => {
            const aItem = Number(a.substring('queue_item_'.length));
            const bItem = Number(b.substring('queue_item_'.length));
            if(bItem > aItem) return -1;
            if(aItem > bItem) return 1;
            return 0;
        })
        console.log('item_list: ' + itemsKeys);
        for(let key in itemsKeys) {
            console.log('Running ' + (Number(key) + 1) + '/' + itemsKeys.length);
            const item = JSON.parse(await this.redisStore.client.get(itemsKeys[key]));
            const pass = await goerliBot.runGoerliFaucet(item.message, item.address, item.hexData);
            if(pass) await this.redisStore.removeFromQueue(itemsKeys[key]);
            console.log('Delete ' + itemsKeys[key] + ' from redis');
        }
        await this.sleep(3000);
        await this.executeQueueList();
    };

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const queueHandler = new QueueHandler(redisStore);

module.exports = queueHandler;