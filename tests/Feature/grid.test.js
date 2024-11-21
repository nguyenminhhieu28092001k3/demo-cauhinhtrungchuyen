const GridService = require('../../app/Services/grid.service');

(async () => {

    const wgs84 = "EPSG:4326";
    const utmZone48N = "EPSG:32648";
    const gridSize = 100; // 100m x 100m
    const bounds = {
        latMin: 10.820882,
        latMax: 10.823964,
        longMin: 106.63167,
        longMax: 106.63779
    };

    const gridService = new GridService(wgs84, utmZone48N, gridSize, bounds);
    await gridService.generateGridAndSave();

})();
