require('dotenv').config({path: '../../.env'});
const DistanceService = require('../../app/Services/Geo/distance.service');

(async () => {

    const googleApiKey = process.env.GOOGLE_MAP_KEY;
    const wgs84 = process.env.WGS84;
    const utmZone = process.env.UTM_ZONE;
    const gridSize = parseInt(process.env.GRID_SIZE);

    const distanceService = new DistanceService(wgs84, utmZone, gridSize, googleApiKey);
    await distanceService.calculatePickupLocationDistanceAll();

    console.log('CalculatePickupLocationDistanceAll successfully.');
    process.exit();
})();

