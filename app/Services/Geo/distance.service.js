const axios = require('axios');
const {Op} = require('sequelize');
const BaseGeoService = require('../baseGeo.service');
const Distance = require('../../Models/Distances.model');
const PickupLocation = require('../../Models/PickupLocation.model');
const GridCell = require('../../Models/GridCell.model');
const {logToFile} = require('../../Helpers/base.helper');

class DistanceService extends BaseGeoService {
    constructor(wgs84, utmZone, gridSize, googleApiKey) {
        super(wgs84, utmZone, gridSize);
        this.googleApiKey = googleApiKey;
        this.searchRadius = 7000;
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
            // case 'GOOGLE_MAP' :
            //     return await this.callDistanceGoogle(origin, destination, this.googleApiKey);
            //
            //     break;
            case 'STRAIGHT_LINE' :
                const [lat1, lon1] = origin.split(',').map(Number);
                const [lat2, lon2] = destination.split(',').map(Number);
                return this.calculateStraightLineDistance(lat1, lon1, lat2, lon2);

                break;
            case 'OPEN_STREET_MAP' :
                return this.callOpenStreetMap(origin, destination);

                break;
        }
    }

    async handleGridCells(gridCells, origin, pickupLocation){
        const distanceData = [];

        for (const gridCell of gridCells) {
            const destination = `${gridCell.latitude},${gridCell.longitude}`;

            try {
                const distance = await this.fetchDrivingDistance(origin, destination);
                //console.log('distance', origin, destination, distance);break;

                distanceData.push({
                    pickup_location_id: pickupLocation.id,
                    grid_cell_id: gridCell.id,
                    distance,
                    created_at: new Date(),
                });

                console.log(
                    `Prepared distance data for PickupLocation(${pickupLocation.id}) and GridCell(${gridCell.id}).`
                );
            } catch (error) {
                console.error(
                    `Error calculating distance for PickupLocation(${pickupLocation.id}) and GridCell(${gridCell.id}):`,
                    error.message
                );
            }
        }
        try {
            if (distanceData.length > 0) {
                await Distance.bulkCreate(distanceData);
                console.log(`Saved ${distanceData.length} distance records in bulk.`);
            }
        } catch (error) {
            console.error("Error saving distance data in bulk:", error.message);
        }
    };

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

            if (gridCellsInRange.length >= 1000) {

                //console.log(1111 , gridCellsInRange.length);
                await this.handleGridCells(gridCellsInRange, origin, pickupLocation);

                gridCellsInRange = [];
                //break;
            }

            offset += chunkSize;
        }

        //console.log(2222 , gridCellsInRange.length);
        //return;
        if (gridCellsInRange.length > 0) {
            await this.handleGridCells(gridCellsInRange, origin, pickupLocation);
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

        await this.getGridCellsInRange(
            pickupLocation.latitude,
            pickupLocation.longitude,
            origin,
            pickupLocation
        );
    }

}

module.exports = DistanceService;