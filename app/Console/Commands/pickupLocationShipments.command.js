const yargs = require("yargs");
require('dotenv').config({path: '../../../.env'});
const Queue = require('bee-queue');
const redisConfig = require('../../../config/redis');
const pickupLocationTransShipmentsQueue = require('../../Queues/pickupLocationTransShipments.queue');
const PickupLocationDistance = require('../../Models/PickupLocationDistance.model');
const {logToFile} = require("../../Helpers/base.helper");
const CacheHelper = require('../../Helpers/cache.helper');

async function addPickupLocationShipmentsToQueue(args) {
    let offset = 0;
    let hasMoreData = true;
    let batchSize = 1000;
    let pickupId = args.pickupId ?? null;

    await CacheHelper.clearCache('pickupLocationDistances');
    await CacheHelper.clearCache('pickupLocations');

    try {
        while (hasMoreData) {

            const whereCondition = pickupId
                ? {from_location_id: pickupId}
                : {};

            const lstPickupLocationDistances = await PickupLocationDistance.findAll({
                raw: true,
                attributes: ['from_location_id', 'to_location_id'],
                where: whereCondition,
                limit: batchSize,
                offset: offset,
            });

            if (lstPickupLocationDistances.length === 0) {
                hasMoreData = false;
                break;
            }

            const jobPromises = lstPickupLocationDistances.map((pickupLocationDistance) => {
                return pickupLocationTransShipmentsQueue.createJob({
                    from_location_id: pickupLocationDistance.from_location_id,
                    to_location_id: pickupLocationDistance.to_location_id,
                })
                    .save()
                    .then((job) => {
                        logToFile(
                            '[INFO][addPickupLocationShipmentsToQueue] ' +
                            `Job created with id: ${job.id} for grid cell ${pickupLocationDistance.from_location_id} and pickup location ${pickupLocationDistance.to_location_id}`,
                            'add_grid_cell_distances_to_queue'
                        );
                    })
                    .catch((error) => {
                        logToFile(
                            '[ERROR][addPickupLocationShipmentsToQueue] Failed to create job:' + JSON.stringify(error),
                            'add_grid_cell_distances_to_queue'
                        );
                    });
            });

            await Promise.all(jobPromises);

            offset += batchSize;
        }

        logToFile('[INFO][addPickupLocationShipmentsToQueue] All distances have been processed', 'add_pickup_location_distances_to_queue');
        console.log('[INFO][addPickupLocationShipmentsToQueue] All distances have been processed');
        process.exit();
    } catch (error) {
        logToFile('[ERROR][addPickupLocationShipmentsToQueue] Error processing distances:' + JSON.stringify(error), 'add_pickup_location_distances_to_queue');
    }
}


const argv = yargs
    .scriptName("pickupLocationTransShipments")
    .usage("$0 <cmd> [args]")
    .command(
        "pickupLocationTransShipments",
        "Calculate Pickup Location TransShipments",
        (yargs) => {
            return yargs.option("pickupId", {
                alias: "p",
                describe: "ID of the Pickup Location",
                type: "number",
                demandOption: false,
            });
        },
        addPickupLocationShipmentsToQueue
    )
    .help()
    .alias("help", "h")
    .demandCommand(1, "You need to specify a command.")
    .argv;


// 1. Tính trung chuyển
// VD: node pickupLocationShipments.command.js pickupLocationTransShipments -p 2
