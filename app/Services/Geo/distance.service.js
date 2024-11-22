const axios = require('axios');
const {Op} = require('sequelize');
const BaseGeoService = require('../baseGeo.service');
const Distance = require('../../Models/Distances.model');
const PickupLocation = require('../../Models/PickupLocation.model');
const GridCell = require('../../Models/GridCell.model');

class DistanceService extends BaseGeoService {
    constructor(wgs84, utmZone, gridSize, googleApiKey) {
        super(wgs84, utmZone, gridSize);
        this.googleApiKey = googleApiKey;
        this.searchRadius = 10000;
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

        if (process.env.IS_CALL_GOOGLE_MAP == 'false') {

            const [lat1, lon1] = origin.split(',').map(Number);
            const [lat2, lon2] = destination.split(',').map(Number);
            return this.calculateStraightLineDistance(lat1, lon1, lat2, lon2);
        }
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
                params: {
                    origins: origin,
                    destinations: destination,
                    key: this.googleApiKey,
                },
            });

            console.log('[CALL GOOGLE API] ' + response?.data);
            if (
                response.data.rows[0].elements[0].status === 'OK' &&
                response.data.rows[0].elements[0].distance
            ) {
                return response.data.rows[0].elements[0].distance.value; // Khoảng cách (m)
            } else {
                throw new Error('Distance data not available.');
            }
        } catch (error) {
            console.error(`Error fetching driving distance:`, error.message);
            throw error;
        }
    }

    async getGridCellsInRange(lat, lon, handleGridCells) {
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


            if (gridCellsInRange.length >= 1000) {
                await handleGridCells(gridCellsInRange);
                gridCellsInRange = [];
            }

            offset += chunkSize;
        }

        if (gridCellsInRange.length > 0) {
            await handleGridCells(gridCellsInRange);
        }
    }

    async calculateAndSaveDistances(pickupLocationId) {

        const pickupLocation = await PickupLocation.findByPk(pickupLocationId, {
            attributes: ['id', 'latitude', 'longitude'],
            raw: true
        });

        if (!pickupLocation) {
            throw new Error(`PickupLocation with ID ${pickupLocationId} not found.`);
        }

        const origin = `${pickupLocation.latitude},${pickupLocation.longitude}`;

        const handleGridCells = async (gridCells) => {
            for (const gridCell of gridCells) {
                const destination = `${gridCell.latitude},${gridCell.longitude}`;

                try {
                    const distance = await this.fetchDrivingDistance(origin, destination);
                    const reverseDistance = await this.fetchDrivingDistance(destination, origin);

                    await Distance.create({
                        pickup_location_id: pickupLocation.id,
                        grid_cell_id: gridCell.id,
                        distance,
                        reverse_distance: reverseDistance,
                        created_at: Date.now(),
                    });

                    console.log(
                        `Saved distance between PickupLocation(${pickupLocation.id}) and GridCell(${gridCell.id}).`
                    );
                } catch (error) {
                    console.error(
                        `Error calculating or saving distance for PickupLocation(${pickupLocation.id}) and GridCell(${gridCell.id}):`,
                        error.message
                    );
                }
            }
        };

        await this.getGridCellsInRange(
            pickupLocation.latitude,
            pickupLocation.longitude,
            handleGridCells
        );
    }

}

module.exports = DistanceService;