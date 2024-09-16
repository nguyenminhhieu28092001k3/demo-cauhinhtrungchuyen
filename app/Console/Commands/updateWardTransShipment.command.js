const Queue = require('bee-queue');
const redisConfig = require('../../../config/redis');
const transShipmentsQueue = require('../../Queues/transShipments.queue')
const WardDistance = require('../../Models/wardDistance.model');

async function addWardDistancesToQueue() {
    try {
        const wardDistances = await WardDistance.findAll({ raw: true });

        for (const distance of wardDistances) {
            transShipmentsQueue.createJob({
                ward_id: distance.ward_id,
                pickup_location_id: distance.pickup_location_id,
                distance: distance.distance,
                reverse_distance: distance.reverse_distance
            })
                .save()
                .then(job => {
                    console.log(`Job created with id: ${job.id} for ward ${distance.ward_id} and pickup location ${distance.pickup_location_id}`);
                })
                .catch(error => {
                    console.error('Failed to create job:', error);
                });
        }

    } catch (error) {
        console.error('Error fetching ward distances:', error);
    }
}

addWardDistancesToQueue();