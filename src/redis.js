const redis = require('redis');

class Redis {
    constructor() {
        this.client = redis.createClient({
            url: process.env.SSV_REDIS_URI
        });
        this.client.connect();
        // this.client.del('queue_next_index')
        // this.removeAllItems();
    }

    getNextIndex = async () => {
        let nextIndex =  await this.client.get('queue_next_index');
        if(!nextIndex) {
            nextIndex = 0;
        }
        return Number(nextIndex) + 1;
    };

    setNextIndex = async (index) => {
       await this.client.set('queue_next_index', index);
    };

    addToQueue = async (message, address, hexData, uniqId) => {
        const nextIndex = await this.getNextIndex();
        await this.client.set(`queue_item_${nextIndex}`, JSON.stringify({message, address, hexData, uniqId, formSubmitted: false}))
        await this.setNextIndex(nextIndex);
    };

    changeFormSubmitted = async (uniqId, status) => {
        const items = await this.getQueueItems();
        for (let key in items) {
            const item = JSON.parse(await this.client.get(items[key]));
            if (item.uniqId === uniqId) {
                if (status) {
                    item.formSubmitted = true;
                    await this.client.set(items[key], JSON.stringify(item));
                } else {
                    console.log(`item deleted key: ${items[key]} value: ${item.message.username} `)
                    await this.client.del(items[key]);
                }
            }
        }
    }

    removeAllItems = async () => {
        const itemsKeys = await this.getQueueItems();
        for (let key in itemsKeys) {
            await this.removeFromQueue(itemsKeys[key]);
        }
        await this.client.del('queue_next_index')
    };

    getQueueItems = async () => {
        return await this.client.keys('queue_item_*')
    };

    removeFromQueue = async (key) => {
        await this.client.del(key);
    };
}

const redisStore = new Redis();

module.exports = redisStore;