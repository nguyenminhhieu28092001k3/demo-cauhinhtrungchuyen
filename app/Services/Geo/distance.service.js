const axios = require('axios');
const pLimit = require('p-limit');
const {Op} = require('sequelize');
const BaseGeoService = require('../baseGeo.service');
const GridCellDistance = require('../../Models/GridCellDistance.model');
const PickupLocation = require('../../Models/PickupLocation.model');
const GridCell = require('../../Models/GridCell.model');
const PickupLocationTransShipments = require('../../Models/PickupLocationTransShipment.model');
const PickupLocationDistance = require('../../Models/PickupLocationDistance.model');
const {logToFile} = require('../../Helpers/base.helper');

class DistanceService extends BaseGeoService {
    constructor(wgs84, utmZone, gridSize, googleApiKey) {
        super(wgs84, utmZone, gridSize);
        this.googleApiKey = googleApiKey;
        this.searchRadius = 9000;
        this.limit = pLimit(10);
    }


    calculateStraightLineDistance(lat1, lon1, lat2, lon2) {
        const toRadians = (degree) => (degree * Math.PI) / 180;
        const R = 6371000; // Bán kính Trái đất (m)

        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Khoảng cách (m)
    }

    async fetchDrivingDistance(origin, destination) {
        switch (process.env.IS_CALL_GET_DISTANCE) {
            case 'GOOGLE_MAP' :
                return await this.callDistanceGoogle(origin, destination, this.googleApiKey);

                break;
            case 'STRAIGHT_LINE' :
                const [lat1, lon1] = origin.split(',').map(Number);
                const [lat2, lon2] = destination.split(',').map(Number);
                return this.calculateStraightLineDistance(lat1, lon1, lat2, lon2);

                break;
            case 'OPEN_STREET_MAP' :
                return await this.callOpenStreetMap(origin, destination);

                break;
        }
    }

    async handleGridCells(gridCells, origin, pickupLocation) {

        const distancePromises = gridCells.map((gridCell, index) =>
            this.limit(async () => {
                const destination = `${gridCell.latitude},${gridCell.longitude}`;
                try {

                    await this.sleep(1000);
                    const distance = await this.fetchDrivingDistance(origin, destination);
                    console.log(
                        `Prepared distance data for PickupLocation(${pickupLocation.id}), Distance ${distance} and GridCell(${gridCell.id}), Thời gian: ${new Date(Date.now()).toISOString()}`
                    );
                    return {
                        pickup_location_id: pickupLocation.id,
                        grid_cell_id: gridCell.id,
                        distance,
                        created_at: new Date(),
                        updated_at: new Date(),
                    };
                } catch (error) {
                    console.error(
                        `Error calculating distance for PickupLocation(${pickupLocation.id}) and GridCell(${gridCell.id}):`,
                        error
                    );
                    return null;
                }
            })
        );

        try {
            const resolvedDistances = await Promise.all(distancePromises);

            const distanceData = resolvedDistances.filter((data) => data !== null);

            if (distanceData.length > 0) {

                // await GridCellDistance.bulkCreate(distanceData, {
                //     updateOnDuplicate: ['distance', 'updated_at'],
                // });
                console.log(`Saved ${distanceData.length} distance records in bulk.`);
            }
        } catch (error) {
            console.error("Error saving distance data in bulk:", error);
        }
    }

    async getGridCellsInRange(lat, lon, origin, pickupLocation) {

        const chunkSize = 1000;
        let offset = 0;
        let gridCellsInRange = [];
        let hasMore = true;

        while (hasMore) {

            const gridCellsChunk = await GridCell.findAll({
                attributes: ['id', 'latitude', 'longitude'],
                limit: chunkSize,
                offset: offset,
                raw: true,
            });

            if (gridCellsChunk.length === 0) {
                hasMore = false;
                break;
            }

            const filteredCells = gridCellsChunk.filter((cell) => {
                const distance = this.calculateStraightLineDistance(
                    lat,
                    lon,
                    cell.latitude,
                    cell.longitude
                );
                return distance <= this.searchRadius;
            });

            gridCellsInRange = gridCellsInRange.concat(filteredCells);

            if (gridCellsInRange.length >= 100) {

                //console.log(1111 , gridCellsInRange.length);
                await this.handleGridCells(gridCellsInRange, origin, pickupLocation);
                // this.handleGridCells(gridCellsInRange, origin, pickupLocation);

                gridCellsInRange = [];
                //break;
            }

            offset += chunkSize;
        }

        //console.log(2222 , gridCellsInRange.length);
        //return;
        if (gridCellsInRange.length > 0) {
            await this.handleGridCells(gridCellsInRange, origin, pickupLocation);
            // this.handleGridCells(gridCellsInRange, origin, pickupLocation);
        }
    }

    async calculateAndSaveGridCellDistances(pickupLocationId) {

        const pickupLocation = await PickupLocation.findByPk(pickupLocationId, {
            attributes: ['id', 'latitude', 'longitude'],
            raw: true
        });

        if (!pickupLocation) {
            throw new Error(`PickupLocation with ID ${pickupLocationId} not found.`);
        }

        const origin = `${pickupLocation.latitude},${pickupLocation.longitude}`;

        await this.getGridCellsInRange(
            pickupLocation.latitude,
            pickupLocation.longitude,
            origin,
            pickupLocation
        );
    }

    static async calculatePath(fromLocationId, toLocationId, pickupLocationDistances, pickupLocationsMap) {
        let [path, pathDistance] = [[], 0];
        let currentFromLocationId = fromLocationId;
        let currentToLocationId = toLocationId;

        path.push(fromLocationId);

        while (true) {
            try {
                const record = await PickupLocationTransShipments.findOne({
                    where: {
                        from_pickup_location_id: currentFromLocationId,
                        to_pickup_location_id: currentToLocationId,
                    },
                    attributes: ['trans_shipment_id'],
                    raw: true,
                });

                if (!record || record.trans_shipment_id === 0 || record.trans_shipment_id === null) {
                    break;
                }

                path.push(record.trans_shipment_id);
                currentFromLocationId = record.trans_shipment_id;
            } catch (error) {
                console.error('Error fetching trans_shipment_id:', error);
                break;
            }
        }
        path.push(toLocationId);

        const pairsPath = path.slice(0, -1).map((value, index) => [value, path[index + 1]]);
        const distances = await Promise.all(
            pairsPath.map(([fromLocationId, toLocationId]) =>
                this.getDistanceM(fromLocationId, toLocationId, pickupLocationDistances, pickupLocationsMap)
            )
        );
        pathDistance = distances.reduce((acc, distance) => acc + distance, 0);

        return [path, pathDistance];
    }

    async calculatePickupLocationDistanceAll(rerun = null) {
        try {
            const pickupLocations = await PickupLocation.findAll({
                attributes: ['id', 'longitude', 'latitude'],
                where: {
                    transshipment_status: 1,
                    type: 1,
                    latitude: {[Op.ne]: 0, [Op.not]: null},
                    longitude: {[Op.ne]: 0, [Op.not]: null},
                    deleted_at: null,
                },
            });

            for (const fromLocation of pickupLocations) {
                for (const toLocation of pickupLocations) {
                    if (fromLocation.id === toLocation.id) {
                        continue;
                    }

                    const existingRecord = await PickupLocationDistance.findOne({
                        where: {
                            from_location_id: fromLocation.id,
                            to_location_id: toLocation.id,
                        },
                    });

                    if (existingRecord && rerun !== 'true') {
                        continue;
                    }

                    const distance = await this.fetchDrivingDistance(`${fromLocation.latitude},${fromLocation.longitude}`,
                        `${toLocation.latitude},${toLocation.longitude}`);

                    await PickupLocationDistance.upsert({
                        from_location_id: fromLocation.id,
                        to_location_id: toLocation.id,
                        distance: distance,
                        active: distance < 10000 ? 1 : 0,
                    });

                    var msg = `[INFO][calculatePickupLocationDistanceAll] Handle :From: ${fromLocation.id} to ${toLocation.id} distance= ${distance}`;
                    console.log(msg);
                    logToFile(
                        msg,
                        'calculate_pickup_location_distance_all'
                    );
                }
            }
        } catch (error) {
            console.error(`Error in calculatePickupLocationDistanceAll: ${error}`);
            logToFile(
                '[ERROR][calculatePickupLocationDistanceAll] Failed handle:' + JSON.stringify(error),
                'calculate_pickup_location_distance_all'
            );
        }
    }
}

module.exports = DistanceService;