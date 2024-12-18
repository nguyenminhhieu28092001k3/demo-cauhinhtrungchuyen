const Queue = require('bee-queue');
const redisConfig = require('../../config/redis');

const pickupLocationTransShipmentsQueue = new Queue('pickupLocationTransShipments', {
    redis: redisConfig,
});

module.exports = pickupLocationTransShipmentsQueue;
