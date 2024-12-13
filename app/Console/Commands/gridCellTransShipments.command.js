const yargs = require("yargs");
require('dotenv').config({path: '../../../.env'});
const Queue = require('bee-queue');
const redisConfig = require('../../../config/redis');
const transShipmentsQueue = require('../../Queues/transShipments.queue');
const Distances = require('../../Models/Distances.model');
const { logToFile } = require("../../Helpers/base.helper");
const CacheHelper = require('../../Helpers/cache.helper');

async function addDistancesToQueue(args) {
    let offset = 0;
    let hasMoreData = true;
    let batchSize = 1000;
    let pickupId = args.pickupId ?? null;

    await CacheHelper.clearCache('distances');
    await CacheHelper.clearCache('pickupLocationDistances');
    await CacheHelper.clearCache('pickupLocations');
    await CacheHelper.clearCache('wards');

    try {
        while (hasMoreData) {

            const whereCondition = pickupId
                ? { pickup_location_id: pickupId }
                : {};

            const lstDistances = await Distances.findAll({
                raw: true,
                attributes: ['grid_cell_id', 'pickup_location_id'],
                where: whereCondition,
                limit: batchSize,
                offset: offset,
            });

            if (lstDistances.length === 0) {
                hasMoreData = false;
                break;
            }

            const jobPromises = lstDistances.map((distance) => {
                return transShipmentsQueue.createJob({
                    grid_cell_id: distance.grid_cell_id,
                    pickup_location_id: distance.pickup_location_id,
                })
                    .save()
                    .then((job) => {
                        logToFile(
                            '[INFO][addDistancesToQueue] ' +
                            `Job created with id: ${job.id} for grid cell ${distance.grid_cell_id} and pickup location ${distance.pickup_location_id}`,
                            'add_distances_to_queue'
                        );
                    })
                    .catch((error) => {
                        logToFile(
                            '[ERROR][addDistancesToQueue] Failed to create job:' + JSON.stringify(error),
                            'add_distances_to_queue'
                        );
                    });
            });

            await Promise.all(jobPromises);

            offset += batchSize;
        }

        logToFile('[INFO][addDistancesToQueue] All distances have been processed', 'add_distances_to_queue');
        console.log('[INFO][addDistancesToQueue] All distances have been processed');
        process.exit();
    } catch (error) {
        logToFile('[ERROR][addDistancesToQueue] Error processing distances:' + JSON.stringify(error), 'add_distances_to_queue');
    }
}



const argv = yargs
    .scriptName("gridCellTransShipments")
    .usage("$0 <cmd> [args]")
    .command(
        "gridCellTransShipments",
        "Calculate grid Cell TransShipments",
        (yargs) => {
            return yargs.option("pickupId", {
                alias: "p",
                describe: "ID of the Pickup Location",
                type: "number",
                demandOption: false,
            });
        },
        addDistancesToQueue
    )
    .help()
    .alias("help", "h")
    .demandCommand(1, "You need to specify a command.")
    .argv;


// 1. Tính trung chuyển
// VD: node gridCellTransShipments.command.js gridCellTransShipments -p 2
