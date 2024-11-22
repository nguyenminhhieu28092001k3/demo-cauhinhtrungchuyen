require('dotenv').config({path: '../../.env'});
const DistanceService = require('../../app/Services/Geo/distance.service');
const {Sequelize} = require('sequelize');

(async () => {
    try {
        const googleApiKey = process.env.GOOGLE_MAP_KEY;
        const wgs84 = process.env.WGS84;
        const utmZone = process.env.UTM_ZONE;
        const gridSize = process.env.GRID_SIZE;

        const distanceService = new DistanceService(wgs84, utmZone, gridSize, googleApiKey);


        //10.825743, 106.632370
        //10.826235, 106.634645

        // distance = distanceService.calculateStraightLineDistance(10.825743, 106.632370, 10.825106, 106.634842);
        // console.log(`Distance from North Pole to South Pole: ${distance.toFixed(2)} meters`);
        // return;


        // const distance = await distanceService.fetchDrivingDistance('10.825743,106.632370', '10.825484,106.634651');
        // console.log(`Driving distance: ${distance} meters`);
        // return;


        const pickupLocationId = 1;
        await distanceService.calculateAndSaveDistances(pickupLocationId);

        console.log('Distance calculation and saving completed successfully.');
    } catch (error) {
        console.error('Error during test execution:', error.message);
    }
})();
