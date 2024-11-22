const proj4 = require("proj4");
const GridCell = require("../../Models/GridCell.model");
const sequelize = require("../../../lib/database");
const BaseGeoService = require("../baseGeo.service");

class GridService extends BaseGeoService {

    constructor(wgs84, utmZone, gridSize, bounds) {
        super(wgs84, utmZone, gridSize, bounds);
    }

    async saveGridCell(gridX, gridY, xMin, yMin, xMax, yMax) {
        try {
            // Tính tọa độ tâm trong hệ UTM
            const utmXCenter = (xMin + xMax) / 2;
            const utmYCenter = (yMin + yMax) / 2;

            // Chuyển đổi tọa độ tâm từ UTM sang WGS84
            const [longitude, latitude] = proj4(this.utmZone, this.wgs84, [utmXCenter, utmYCenter]);

            // Tìm hoặc tạo ô lưới với tọa độ tâm
            const [gridCell, created] = await GridCell.findOrCreate({
                where: {gridX, gridY},
                defaults: {xMin, yMin, xMax, yMax, latitude, longitude},
            });

            if (created) {
                console.log(`Ô lưới (${gridX}, ${gridY}) đã được tạo với tâm tại (${latitude}, ${longitude}).`);
            } else {
                console.log(`Ô lưới (${gridX}, ${gridY}) đã tồn tại.`);
            }
        } catch (error) {
            console.error(`Lỗi khi lưu ô lưới (${gridX}, ${gridY}):`, error);
        }
    }

    async generateGridAndSave() {
        const {latMin, latMax, longMin, longMax} = this.bounds;

        // VD: 500m = 500 / 111000 = 0.0045 độ
        var step = Number((this.gridSize / GridService.ArcDegreeOnEarthSurface).toFixed(4));

        for (let lat = latMin; lat <= latMax; lat += step) {
            for (let long = longMin; long <= longMax; long += step) {

                const [utmX, utmY] = this.convertLatLongToUTM(lat, long);

                const {gridX, gridY} = this.getGridIndex(utmX, utmY);
                const xMin = gridX * this.gridSize;
                const yMin = gridY * this.gridSize;
                const xMax = xMin + this.gridSize;
                const yMax = yMin + this.gridSize;

                await this.saveGridCell(gridX, gridY, xMin, yMin, xMax, yMax);
            }
        }

        console.log("Đã hoàn thành việc chia và lưu các ô lưới.");
    }
}

module.exports = GridService;
