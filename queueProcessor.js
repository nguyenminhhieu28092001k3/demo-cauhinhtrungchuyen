const BeeQueue = require('bee-queue');
const fs = require('fs');
const {Worker} = require('worker_threads');
const redisConfig = require('./config/redis')
const GridCellTransShipment = require('./app/Models/GridCellTransShipment.model')
const {logToFile} = require("./app/Helpers/base.helper");
require('dotenv').config();

const queue = new BeeQueue('transShipments', {
    redis: redisConfig,
    isWorker: true,
    removeOnSuccess: true
});

function runHeavyComputationInWorker(gridCellId, pickupLocationId) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./app/Workers/worker.js', {workerData: {gridCellId, pickupLocationId}});

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

queue.process(1, async (job) => {
    try {
        let start = Date.now();

        let existingRecord = await GridCellTransShipment.findOne({
            where: {
                pickup_location_id: job.data.pickup_location_id,
                grid_cell_id: job.data.grid_cell_id,
            },
            attributes: ['id']
        });

        if (existingRecord) {
            return true;
        }
        let transShipmentId = await runHeavyComputationInWorker(job.data.grid_cell_id, job.data.pickup_location_id);

        await GridCellTransShipment.create({
            pickup_location_id: job.data.pickup_location_id,
            grid_cell_id: job.data.grid_cell_id,
            trans_shipment_id: transShipmentId || 0,
        });

        let end = Date.now();

        let logMessage = `Job ${JSON.stringify(job.data)} bắt đầu lúc: ${new Date(start).toISOString()}, kết thúc lúc: ${new Date(end).toISOString()},  Kết quả: ${transShipmentId}`;
        logToFile(logMessage, 'queue_processor')

    } catch (err) {
        let logMessage = `Job ${JSON.stringify(job.data)}  thất bại với lỗi: ${err.message}, Ket Qua : ${JSON.stringify(transShipmentId || 0)}`;
        logToFile(logMessage, 'queue_processor')
    }
});
