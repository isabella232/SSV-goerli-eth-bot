require('dotenv').config();
const redisStore = require('./redis');
const goerliBot = require('./goerliBot.js');

class QueueHandler {
    constructor(redisStore) {
        this.redisStore = redisStore;
    }

    executeQueueList = async () => {
        const itemsKeys = await this.redisStore.getQueueItems();
        if(itemsKeys.length) {
            console.log('item_list: ' + itemsKeys);
        } else {
            console.log('Queue is empty');
        }
        itemsKeys.sort((a, b) => {
            const aItem = Number(a.substring('queue_item_'.length));
            const bItem = Number(b.substring('queue_item_'.length));
            if (bItem > aItem) return -1;
            if (aItem > bItem) return 1;
            return 0;
        })

        for (let key in itemsKeys) {
            const item = JSON.parse(await this.redisStore.client.get(itemsKeys[key]));
            console.log(`Running ' + ${(Number(key) + 1)}/${itemsKeys.length} `,item.address);
            if(item.formSubmitted) {
                await goerliBot.runGoerliFaucet(item.message, item.address, item.hexData);
                await this.redisStore.removeFromQueue(itemsKeys[key]);
                console.log('Delete ' + itemsKeys[key] + ' from redis');
            }
        }

        await this.sleep(5000);
        await this.executeQueueList();
    };

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const queueHandler = new QueueHandler(redisStore);

module.exports = queueHandler;