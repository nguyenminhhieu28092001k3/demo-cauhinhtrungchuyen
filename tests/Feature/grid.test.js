require('dotenv').config({path: '../../.env'});
const GridService = require('../../app/Services/Geo/grid.service');

(async () => {

    const wgs84 = process.env.WGS84;
    const utmZone = process.env.UTM_ZONE;

    const gridSize = process.env.GRID_SIZE; // 100m x 100m
    const bounds = {
        latMin: 10.5256,
        latMax: 11.0410,
        longMin: 106.4616,
        longMax: 107.0247
    };

    const gridService = new GridService(wgs84, utmZone, gridSize, bounds);
    await gridService.generateGridAndSave();

})();
