const {Op} = require('sequelize');
const calculateKilometerByCoordinate = require('../Helpers/calculateKilometerByCoordinate.helper')
const PickupLocation = require('../Models/PickupLocation.model');
const Ward = require('../Models/Ward.model');
const PickupLocationDistance = require('../Models/PickupLocationDistance.model');
const WardDistance = require('../Models/wardDistance.model');
const Distances = require('../Models/Distances.model');
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

        gridCellId  = 114889;
        pickupLocationId = 80;


        const positionA = await PickupLocation.findByPk(pickupLocationId);
        const positionO = await GridCell.findByPk(gridCellId);

        if (!positionA || !positionO) return null;

        const distances = await Distances.findAll({
            where: {
                grid_cell_id: gridCellId
            }
        });
        const pickupLocationDistances = await CacheHelper.getCachedData('pickupLocationDistances', PickupLocationDistance);
        const wards = await CacheHelper.getCachedData('wards', Ward, {
            where: {
                longitude: {
                    [Op.not]: null
                },
                latitude: {
                    [Op.not]: null
                }
            }
        });
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

        const distanceAO = await this.getPickupLocationToDistance(positionA.id, positionO.id, distances);

        if (distanceAO <= radius) return null;

        const positionB = await this.getNearestPickupLocationByGridCell(gridCellId, distances, pickupLocations);

        console.log(positionB);
        process.exit()

        const distanceAB = await this.getDistance(positionA.id, positionB.id, pickupLocationDistances, pickupLocations, wards);

        if (distanceAB <= FindTransshipmentPointService.L_MIN || positionA.id === positionB.id) return null;

        if (distanceAB > FindTransshipmentPointService.L_MIN && distanceAB < FindTransshipmentPointService.L_MAX) {
            if (distanceAO <= distanceAB) return null;

            const distanceBO = await this.getPickupLocationToDistance(positionB.id, positionO.id, distances);
            if (distanceBO <= FindTransshipmentPointService.ONE_KM && (distanceAO > FindTransshipmentPointService.L_MIN && distanceAO < FindTransshipmentPointService.L_MAX)) {
                return null;
            } else {
                return positionB.id;
            }
        }

        const positionX = await this.findPositionX(
            positionB.id,
            positionA.id,
            positionO.id,
            pickupLocationDistances,
            distances,
            distanceAO,
            pickupLocations,
            wards
        );

        if (positionX) return positionX.id;

        let lMaxPlus = FindTransshipmentPointService.L_MAX;
        while (lMaxPlus <= distanceAO) {
            lMaxPlus++;
            const positionY = await this.findPositionX(
                positionB.id,
                positionA.id,
                positionO.id,
                pickupLocationDistances,
                distances,
                distanceAO,
                pickupLocations,
                wards,
                FindTransshipmentPointService.L_MAX,
                lMaxPlus,
                false
            );

            if (positionY) {
                const distanceAY = await this.getDistance(positionA.id, positionY.id, pickupLocationDistances, pickupLocations, wards);
                if (distanceAY < distanceAO) {
                    return positionY.id;
                }
            }
        }

        return null;
    }

    async getNearestPickupLocationByGridCell(gridCellId, distances, pickupLocations) {
        let minDistance = Infinity;
        let nearestPickupLocationId = 0;

        const distancesFiltered = distances.filter(item => item.grid_cell_id === gridCellId);
        const pickupLocationsFiltered = pickupLocations.filter(location => distancesFiltered.some(d => d.pickup_location_id === location.id));

        for (const dis of distancesFiltered) {

            let distanceKm = (dis.distance / 1000).toFixed(2);

            console.log(distanceKm);


            const pickupLocation = pickupLocationsFiltered.find(loc => loc.id === dis.pickup_location_id);

            if (distanceKm < minDistance && pickupLocation) {
                minDistance = distanceKm;
                nearestPickupLocationId = dis.pickup_location_id;
            }


        }



        return [minDistance, nearestPickupLocationId];

        return pickupLocationsFiltered.find(loc => loc.id === nearestPickupLocationId);
    }

    // R
    async getDistance(fromLocationId, toLocationId, pickupLocationDistances, pickupLocations, wards) {
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

        return Math.round(distance / 1000);
    }

    async getPickupLocationToDistance(pickupLocationId, gridCell, distances) {

        const distanceRow = distances.find(item => item.grid_cell_id === gridCell && item.pickup_location_id === pickupLocationId);

        let distance = distanceRow ? distanceRow.distance : 0;

        return Math.round(distance / 1000);
    }

    async findPositionX(positionB_Id, fromLocationId, toLocationId, pickupLocationDistances, distances, distanceAO, pickupLocations, wards, lMin = FindTransshipmentPointService.L_MIN, lMax = FindTransshipmentPointService.L_MAX, biggerLMin = true) {
        let positionXId = 0;
        let minDistance = Infinity;

        for (const tmpLocation of pickupLocations) {
            const distance1 = await this.getDistance(fromLocationId, tmpLocation.id, pickupLocationDistances, pickupLocations, wards);

            if (!distance1) continue;

            const distance2 = await this.getPickupLocationToDistance(tmpLocation.id, toLocationId, distances);

            if (!distance2) continue;

            const distance = distance1 + distance2;
            const distanceAX = await this.getDistance(fromLocationId, tmpLocation.id, pickupLocationDistances, pickupLocations, wards);

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
