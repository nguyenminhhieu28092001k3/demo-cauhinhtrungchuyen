const Queue = require('bee-queue');
const redisConfig = require('../../config/redis');

const transShipmentsQueue = new Queue('transShipments', {
    redis: redisConfig,
});

module.exports = transShipmentsQueue;
