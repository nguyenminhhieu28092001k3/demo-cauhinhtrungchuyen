const {Op} = require('sequelize');
const calculateKilometerByCoordinate = require('../Helpers/calculateKilometerByCoordinate.helper')
const PickupLocation = require('../Models/PickupLocation.model');
const PickupLocationDistance = require('../Models/PickupLocationDistance.model');
const CacheHelper = require('../Helpers/cache.helper');
const {logToFile} = require("../Helpers/base.helper");

class FindPickupLocationTransshipmentPointService {
    static L_MIN = 4;
    static L_MAX = 7;
    static ONE_KM = 1;
    static RADIUS = 5;
    static ACTIVE = 1;

    constructor() {
    }

    async execute(workerData) {

        try {
            // 0 : địa phận giao đơn
            // A : Điểm lấy của đơn
            // R : Bán kính điểm lấy
            // L, R thuộc A
            // Tìm SHOP thuộc O
            
            let {fromPickupLocationId, toPickupLocationId} = workerData;

            const positionA = { id: fromPickupLocationId };
            const positionO = { id: toPickupLocationId };

            let [pickupLocationDistances, pickupLocations, pickupLocationODistances] = await Promise.all([
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
                            status: FindPickupLocationTransshipmentPointService.ACTIVE,
                            type: FindPickupLocationTransshipmentPointService.ACTIVE,
                            longitude: { [Op.not]: null },
                            latitude: { [Op.not]: null },
                            deleted_at: { [Op.is]: null }
                        }
                    },
                    3600,
                    ['id', 'name', 'latitude', 'longitude']
                ),
                PickupLocationDistance.findAll({
                    where: { to_location_id: toPickupLocationId },
                    order: [['distance', 'ASC']],
                    raw: true
                })
            ]);

            const pickupLocationsMap = new Map(pickupLocations.map(loc => [loc.id, loc]));

            const radius = FindPickupLocationTransshipmentPointService.RADIUS;

            const distanceAO = await this.getDistance(positionA.id, positionO.id, pickupLocationDistances, pickupLocationsMap);
            
            // 1.2
            if (distanceAO <= radius) return 0;

            // 3.4
            const positionB = await this.getNearestPickupLocationByPositionO(pickupLocationODistances, pickupLocationsMap);
            
            if (!positionB) return 0;
            let distanceAB = await this.getDistance(positionA.id, positionB.id, pickupLocationDistances, pickupLocationsMap);

            // 5
            if (distanceAB <= FindPickupLocationTransshipmentPointService.L_MIN || positionA.id === positionB.id) return 0;

            // 6
            if (distanceAB > FindPickupLocationTransshipmentPointService.L_MIN && distanceAB < FindPickupLocationTransshipmentPointService.L_MAX) {

                // 7
                if (distanceAO <= distanceAB) return 0;

                // 8
                const distanceBO = await this.getDistance(positionB.id, positionO.id, pickupLocationDistances, pickupLocationsMap);
                
                if (distanceBO <= FindPickupLocationTransshipmentPointService.ONE_KM && (distanceAO > FindPickupLocationTransshipmentPointService.L_MIN && distanceAO < FindPickupLocationTransshipmentPointService.L_MAX)) {
                    return 0;
                } else {

                    // 9
                    return positionB.id;
                }
            }

            // 10.11
            const positionX = await this.findPositionX(positionB.id, positionA.id, positionO.id, pickupLocationDistances, distanceAO, pickupLocationsMap);
            
            // 12
            if (positionX) return positionX.id;

            //13
            let lMaxPlus = FindPickupLocationTransshipmentPointService.L_MAX;

            while (lMaxPlus <= distanceAO) {
                lMaxPlus += 5;
                const positionY = await this.findPositionX(
                    positionB.id,
                    positionA.id,
                    positionO.id,
                    pickupLocationDistances,
                    distanceAO,
                    pickupLocationsMap,
                    FindPickupLocationTransshipmentPointService.L_MAX,
                    lMaxPlus,
                    false
                );

                // 14
                if (positionY) {
                    
                    const distanceAY = await this.getDistance(positionA.id, positionY.id, pickupLocationDistances, pickupLocationsMap);
                    if (distanceAY < distanceAO) {

                        // 15
                        return positionY.id;
                    }
                }
            }

            return 0;

        } catch (e) {
           console.log(e)
           logToFile(e, 'error_calculate_queue_processor')
        }
    }

    async getNearestPickupLocationByPositionO(pickupLocationODistances, pickupLocationsMap) {
        if(pickupLocationODistances[0]){
            return pickupLocationsMap.get(pickupLocationODistances[0].from_location_id) || 0;
        }
        return 0;
    }

    async getDistance(fromLocationId, toLocationId, pickupLocationDistances, pickupLocationsMap) {

        const pickupLocationDistance = pickupLocationDistances.find(item => item.from_location_id === fromLocationId && item.to_location_id === toLocationId);

        let distance = pickupLocationDistance ? pickupLocationDistance.distance : 0;

        const fromPickupLocation = pickupLocationsMap.get(fromLocationId);
        
        if (!distance) {
            const fromPickupLocation = pickupLocationsMap.get(fromLocationId);
            const toPickupLocation = pickupLocationsMap.get(toLocationId);

            if(fromPickupLocation && toPickupLocation) {
                const result = calculateKilometerByCoordinate(
                    fromPickupLocation.longitude,
                    fromPickupLocation.latitude,
                    toPickupLocation.longitude,
                    toPickupLocation.latitude
                );

                return parseFloat(Math.round(result)) || 0;
            }else{
                return 0;
            }
        }

        return parseFloat((distance / 1000).toFixed(2));
    }

    async findPositionX(
        positionB_Id,
        fromLocationId,
        toLocationId,
        pickupLocationDistances,
        distanceAO,
        pickupLocationsMap,
        lMin = FindPickupLocationTransshipmentPointService.L_MIN,
        lMax = FindPickupLocationTransshipmentPointService.L_MAX,
        biggerLMin = true
    ) {
        let positionXId = 0;
        let minDistance = Infinity;

        for (const tmpLocation of pickupLocationsMap.values()) {

            if(fromLocationId === tmpLocation.id) continue;

            const distance1 = await this.getDistance(fromLocationId, tmpLocation.id, pickupLocationDistances, pickupLocationsMap);

            if (!distance1) continue;

            const distance2 = await this.getDistance(tmpLocation.id, toLocationId, pickupLocationDistances, pickupLocationsMap);

            if (!distance2) continue;

            const distance = distance1 + distance2;
            const distanceAX = distance1;

            const ruleL = biggerLMin ? (distanceAX > lMin && distanceAX < lMax) : (distanceAX >= lMin && distanceAX < lMax);
            const ruleXoLtAo = (distance2 < distanceAO);

            if (distance < minDistance && tmpLocation.id !== positionB_Id && ruleL && ruleXoLtAo && distance2 > FindPickupLocationTransshipmentPointService.ONE_KM) {
                minDistance = distance;
                positionXId = tmpLocation.id;
            }
        }

        return pickupLocationsMap.get(positionXId) || null;
    }
}

module.exports = FindPickupLocationTransshipmentPointService;
