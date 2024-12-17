const {Op} = require('sequelize');
const calculateKilometerByCoordinate = require('../Helpers/calculateKilometerByCoordinate.helper')
const PickupLocation = require('../Models/PickupLocation.model');
const Ward = require('../Models/Ward.model');
const PickupLocationDistance = require('../Models/PickupLocationDistance.model');
const GridCellDistance = require('../Models/GridCellDistance.model');
const GridCell = require('../Models/GridCell.model');
const CacheHelper = require('../Helpers/cache.helper');

class FindTransshipmentPointService {
    static L_MIN = 4;
    static L_MAX = 6;
    static ONE_KM = 1;
    static RADIUS = 5;
    static ACTIVE = 1;

    constructor() {
    }

    async execute(workerData) {

        // 0 : địa phận giao đơn
        // A : Điểm lấy của đơn
        // R : Bán kính điểm lấy
        // L, R thuộc A
        // Tìm SHOP thuộc O

        let {gridCellId, pickupLocationId} = workerData;

        const positionA = await PickupLocation.findByPk(pickupLocationId);
        const positionO = await GridCell.findByPk(gridCellId);

        if (!positionA || !positionO) return null;

        const gridCelldistances = await GridCellDistance.findAll({
            where: {
                grid_cell_id: gridCellId
            }
        });

        const pickupLocationDistances = await CacheHelper.getCachedData('pickupLocationDistances', PickupLocationDistance);
        const pickupLocations = await CacheHelper.getCachedData('pickupLocations', PickupLocation, {
            where: {
                status: FindTransshipmentPointService.ACTIVE,
                type: FindTransshipmentPointService.ACTIVE,
                longitude: {
                    [Op.not]: null
                },
                latitude: {
                    [Op.not]: null
                },
                deleted_at: {
                    [Op.is]: null
                }
            }
        });

        const radius = positionA.pickup_radius > 0
            ? positionA.pickup_radius
            : FindTransshipmentPointService.RADIUS;

        const distanceAO = await this.getPickupLocationToGridCellDistance(positionA.id, positionO.id, gridCelldistances);

        // 1.2
        if (distanceAO <= radius) return null;

        // 3.4
        const positionB = await this.getNearestPickupLocationByGridCell(gridCellId, gridCelldistances, pickupLocations);
        const distanceAB = await this.getDistance(positionA.id, positionB.id, pickupLocationDistances, pickupLocations);

        // 5
        if (distanceAB <= FindTransshipmentPointService.L_MIN || positionA.id === positionB.id) return null;
        if (!positionO || !positionA || !positionB) return null;

        // 6
        if (distanceAB > FindTransshipmentPointService.L_MIN && distanceAB < FindTransshipmentPointService.L_MAX) {

            // 7
            if (distanceAO <= distanceAB) return null;

            // 8
            const distanceBO = await this.getPickupLocationToGridCellDistance(positionB.id, positionO.id, gridCelldistances);

            if (distanceBO <= FindTransshipmentPointService.ONE_KM && (distanceAO > FindTransshipmentPointService.L_MIN && distanceAO < FindTransshipmentPointService.L_MAX)) {
                return null;
            } else {

                // 9
                return positionB.id;
            }
        }

        // 10.11
        const positionX = await this.findPositionX(
            positionB.id,
            positionA.id,
            positionO.id,
            pickupLocationDistances,
            gridCelldistances,
            distanceAO,
            pickupLocations,
        );

        // 12
        if (positionX) return positionX.id;

        return null;
    }

    async getNearestPickupLocationByGridCell(gridCellId, gridCelldistances, pickupLocations) {
        let minDistance = Infinity;
        let nearestPickupLocationId = 0;

        const gridCelldistancesFiltered = gridCelldistances.filter(item => item.grid_cell_id === gridCellId);
        const pickupLocationsFiltered = pickupLocations.filter(location => gridCelldistancesFiltered.some(d => d.pickup_location_id === location.id));

        for (const dis of gridCelldistancesFiltered) {

            let distanceKm = (dis.distance / 1000).toFixed(2);

            const pickupLocation = pickupLocationsFiltered.find(loc => loc.id === dis.pickup_location_id);

            if (distanceKm < minDistance && pickupLocation) {
                minDistance = distanceKm;
                nearestPickupLocationId = dis.pickup_location_id;
            }
        }
        return pickupLocationsFiltered.find(loc => loc.id === nearestPickupLocationId);
    }

    async getDistance(fromLocationId, toLocationId, pickupLocationDistances, pickupLocations) {
        const pickupLocationDistance = pickupLocationDistances.find(item => item.from_location_id === fromLocationId && item.to_location_id === toLocationId);

        let distance = pickupLocationDistance ? pickupLocationDistance.distance : 0;

        if (!distance) {
            const fromPickupLocation = pickupLocations.find(loc => loc.id === fromLocationId);
            const toPickupLocation = pickupLocations.find(loc => loc.id === toLocationId);

            const result = calculateKilometerByCoordinate(
                fromPickupLocation.longitude,
                fromPickupLocation.latitude,
                toPickupLocation.longitude,
                toPickupLocation.latitude
            );

            return Math.round(result) || 0;
        }

        return (distance / 1000).toFixed(2);
    }

    async getPickupLocationToGridCellDistance(pickupLocationId, gridCell, gridCellDistances) {

        const distanceRow = gridCellDistances.find(item => item.grid_cell_id === gridCell && item.pickup_location_id === pickupLocationId);

        let distance = distanceRow ? distanceRow.distance : 0;

        return (distance / 1000).toFixed(2);
    }

    async findPositionX(positionB_Id, fromLocationId, toLocationId, pickupLocationDistances, gridCelldistances, distanceAO, pickupLocations, lMin = FindTransshipmentPointService.L_MIN, lMax = FindTransshipmentPointService.L_MAX, biggerLMin = true) {
        let positionXId = 0;
        let minDistance = Infinity;

        for (const tmpLocation of pickupLocations) {
            const distance1 = await this.getDistance(fromLocationId, tmpLocation.id, pickupLocationDistances, pickupLocations);

            if (!distance1) continue;

            const distance2 = await this.getPickupLocationToGridCellDistance(tmpLocation.id, toLocationId, gridCelldistances);

            if (!distance2) continue;

            const distance = distance1 + distance2;
            const distanceAX = await this.getDistance(fromLocationId, tmpLocation.id, pickupLocationDistances, pickupLocations);

            const ruleL = biggerLMin ? (distanceAX > lMin && distanceAX < lMax) : (distanceAX >= lMin && distanceAX < lMax);
            const ruleXoLtAo = (distance2 < distanceAO);

            if (distance < minDistance && tmpLocation.id !== positionB_Id && ruleL && ruleXoLtAo && distance2 > FindTransshipmentPointService.ONE_KM) {
                minDistance = distance;
                positionXId = tmpLocation.id;
            }
        }

        return pickupLocations.find(loc => loc.id === positionXId);
    }
}

module.exports = FindTransshipmentPointService;
