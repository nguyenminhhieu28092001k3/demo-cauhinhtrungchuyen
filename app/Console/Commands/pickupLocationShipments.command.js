const yargs = require("yargs");
require('dotenv').config({path: '../../../.env'});
const Queue = require('bee-queue');
const redisConfig = require('../../../config/redis');
const pickupLocationTransShipmentsQueue = require('../../Queues/pickupLocationTransShipments.queue');
const DistanceService = require('../../Services/Geo/distance.service');
const PickupLocationDistance = require('../../Models/PickupLocationDistance.model');
const {logToFile} = require("../../Helpers/base.helper");
const CacheHelper = require('../../Helpers/cache.helper');
const PickupLocation = require("../../Models/PickupLocation.model");
const {Op} = require("sequelize");

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
                    from_pickup_location_id: pickupLocationDistance.from_location_id,
                    to_pickup_location_id: pickupLocationDistance.to_location_id,
                })
                    .save()
                    .then((job) => {
                        logToFile(
                            '[INFO][addPickupLocationShipmentsToQueue] ' +
                            `Job created with id: ${job.id} for grid cell ${pickupLocationDistance.from_location_id} and pickup location ${pickupLocationDistance.to_location_id}`,
                            'add_pickup_location_distances_to_queue'
                        );
                    })
                    .catch((error) => {
                        logToFile(
                            '[ERROR][addPickupLocationShipmentsToQueue] Failed to create job:' + JSON.stringify(error),
                            'add_pickup_location_distances_to_queue'
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

async function handleAddPath(args) {
    let offset = 0;
    let hasMoreData = true;
    let batchSize = 1000;
    let pickupId = args.pickupId ?? null;

    try {
        let [pickupLocationDistances, pickupLocations] = await Promise.all([
            CacheHelper.getCachedData(
                'pickupLocationDistances',
                PickupLocationDistance,
                {},
                3600,
                ['id', 'from_location_id', 'to_location_id', 'distance']
            ),
            CacheHelper.getCachedData(
                'pickupLocations',
                PickupLocation,
                {
                    where: {
                        status: 1,
                        type: 1,
                        longitude: { [Op.not]: null },
                        latitude: { [Op.not]: null },
                        deleted_at: { [Op.is]: null }
                    }
                },
                3600,
                ['id', 'name', 'latitude', 'longitude']
            )
        ]);
        
        const pickupLocationsMap = new Map(pickupLocations.map(loc => [loc.id, loc]));

        while (hasMoreData) {
            const whereCondition = pickupId
                ? {from_location_id: pickupId}
                : {};

            const lstPickupLocationDistances = await PickupLocationDistance.findAll({
                attributes: ['id', 'from_location_id', 'to_location_id', 'path', 'path_distance'],
                where: whereCondition,
                limit: batchSize,
                offset: offset,
            });

            if (lstPickupLocationDistances.length === 0) {
                hasMoreData = false;
                break;
            }

            const jobPromises = lstPickupLocationDistances.map(async (pickupLocationDistance) => {
                try {
                    const {from_location_id, to_location_id} = pickupLocationDistance;

                    let [path, pathDistance] = await DistanceService.calculatePath(from_location_id, to_location_id, pickupLocationDistances, pickupLocationsMap);

                    pickupLocationDistance.path = JSON.stringify(path);
                    pickupLocationDistance.path_distance = pathDistance;

                    await pickupLocationDistance.save();

                    console.log(`From: ${from_location_id} to ${to_location_id} path: ${JSON.stringify(path)}, pathDistance: ${pathDistance}`);
                } catch (error) {
                    let errorMsg = `[ERROR][addPathPickupLocationShipments] Failed to update path for from_location_id: ${pickupLocationDistance.from_location_id}, to_location_id: ${pickupLocationDistance.to_location_id}` + JSON.stringify(error.message);
                    console.error(error);
                    logToFile(errorMsg, 'add_add_path_pickup_location_distances');
                }
            });

            await Promise.all(jobPromises);

            offset += batchSize;
        }

        logToFile('[INFO][addPathPickupLocationShipments] All distances have been processed', 'add_add_path_pickup_location_distances');
        console.log('[INFO][addPathPickupLocationShipments] All distances have been processed');
        process.exit();
    } catch (error) {
        console.log(error)
        logToFile('[ERROR][addPathPickupLocationShipments] Error processing distances:' + JSON.stringify(error), 'add_add_path_pickup_location_distances');
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
    .command(
        "addPath",
        "Calculate and save a list of specific routes",
        (yargs) => {
            return yargs.option("pickupId", {
                alias: "p",
                describe: "ID of the Pickup Location",
                type: "number",
                demandOption: false,
            });
        },
        handleAddPath
    )
    .help()
    .alias("help", "h")
    .demandCommand(1, "You need to specify a command.")
    .argv;


// 1. Tính trung chuyển
// VD: node pickupLocationShipments.command.js pickupLocationTransShipments -p 2

// 2. Thêm tuyến vào bảng pickup_location_distances
// VD: node pickupLocationShipments.command.js addPath -p 2
