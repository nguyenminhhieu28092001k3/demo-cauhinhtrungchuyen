const GridService = require('../../app/Services/grid.service');

(async () => {

    const wgs84 = "EPSG:4326";
    const utmZone48N = "EPSG:32648";
    const gridSize = 100; // 100m x 100m
    const bounds = {
        latMin: 10.5256,
        latMax: 11.0410,
        longMin: 106.4616,
        longMax: 107.0247
    };

    const gridService = new GridService(wgs84, utmZone48N, gridSize, bounds);
    await gridService.generateGridAndSave();

})();
