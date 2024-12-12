const GridService = require('../../Services/Geo/grid.service');
const DistanceService = require('../../Services/Geo/distance.service');

class GridController {

    constructor() {
        const wgs84 = process.env.WGS84;
        const utmZone = process.env.UTM_ZONE;
        const gridSize = parseInt(process.env.GRID_SIZE);
        const googleApiKey = process.env.GOOGLE_MAP_KEY;

        this.distanceService = new DistanceService(wgs84, utmZone, gridSize, googleApiKey);
    }

    async generateAndSaveGrid(wgs84, utmZone, gridSize, bounds) {
        try {

            const gridService = new GridService(wgs84, utmZone, gridSize, bounds);
            await gridService.generateGridAndSave();
            console.log("Grid generation and saving completed successfully.");
        } catch (error) {
            console.error("Error in grid generation and saving:", error);
        }
    }

    async calculateAndSaveDistances(pickupLocationId) {
        try {
            console.log(`Starting distance calculation for PickupLocation ID: ${pickupLocationId}`);
            await this.distanceService.calculateAndSaveDistances(pickupLocationId);
            console.log(`Distance calculation and saving completed for PickupLocation ID: ${pickupLocationId}`);
        } catch (error) {
            console.error(`Error in calculateAndSaveDistances:`, error.message);
            throw error;
        }
    }

}

module.exports = GridController;
