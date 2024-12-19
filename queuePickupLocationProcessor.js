const BeeQueue = require('bee-queue');
const fs = require('fs');
const {Worker} = require('worker_threads');
const redisConfig = require('./config/redis')
const PickupLocationTransShipment = require('./app/Models/PickupLocationTransShipment.model')
const {logToFile} = require("./app/Helpers/base.helper");
const FindPickupLocationTransshipmentPointService = require('./app/Services/pickupLocationTransShipments.service')
require('dotenv').config();

const queue = new BeeQueue('pickupLocationTransShipments', {
    redis: redisConfig,
    isWorker: true,
    removeOnSuccess: true
});

function runHeavyComputationInWorker(fromPickupLocationId, toPickupLocationId) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./app/Workers/pickupLocationWorker.js', {workerData: {fromPickupLocationId, toPickupLocationId}});

        worker.on('message', (result) => {
            worker.terminate();
            resolve(result);
        });
        worker.on('error', (error) => {
            worker.terminate(); // Kết thúc Worker khi có lỗi
            reject(error);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}

queue.process(20, async (job) => {
    try {
        let transShipmentId = 0;
        let start = Date.now();

        await PickupLocationTransShipment.destroy({
            where: {
                from_pickup_location_id: job.data.from_pickup_location_id,
                to_pickup_location_id: job.data.to_pickup_location_id,
            }
        });

        // transShipmentId = await runHeavyComputationInWorker(
        //     job.data.from_pickup_location_id,
        //     job.data.to_pickup_location_id
        // );
        transShipmentId = await (new FindPickupLocationTransshipmentPointService).execute({
            fromPickupLocationId: job.data.from_pickup_location_id,
            toPickupLocationId: job.data.to_pickup_location_id
        });

        await PickupLocationTransShipment.create({
            from_pickup_location_id: job.data.from_pickup_location_id,
            to_pickup_location_id: job.data.to_pickup_location_id,
            trans_shipment_id: transShipmentId || 0,
        });

        let end = Date.now();

        let logMessage = `Job ${JSON.stringify(job.data)} bắt đầu lúc: ${new Date(start).toISOString()}, kết thúc lúc: ${new Date(end).toISOString()},  Kết quả: ${transShipmentId || 0}`;
        console.log(logMessage)
        logToFile(logMessage, 'queue_processor')

    } catch (err) {
        let logMessage = `Job ${JSON.stringify(job.data)}  thất bại với lỗi: ${err.message}, Ket Qua : ${JSON.stringify(transShipmentId || 0)}`;
        console.log(logMessage)
        logToFile(logMessage, 'queue_processor')
    }
});
