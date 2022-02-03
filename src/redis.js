const redis = require('redis');

class Redis {
    constructor() {
        this.client = redis.createClient({
            url: process.env.SSV_REDIS_URI
        });
        this.client.connect();
        this.client.del('queue_next_index')
        this.removeAllItems();
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

    addToQueue = async (message, address, hexData) => {
        const nextIndex = await this.getNextIndex();
        await this.client.set(`queue_item_${nextIndex}`, JSON.stringify({message, address, hexData}))
        await this.setNextIndex(nextIndex);
    };

    removeAllItems = async () => {
        const itemsKeys = await this.getQueueItems();
        for (let key in itemsKeys) {
            await this.removeFromQueue(itemsKeys[key]);
        }
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