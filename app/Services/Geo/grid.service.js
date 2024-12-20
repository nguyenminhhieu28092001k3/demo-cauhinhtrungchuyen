const proj4 = require("proj4");
const OpenLocationCode = require('open-location-code').OpenLocationCode;
const GridCell = require("../../Models/GridCell.model");
const sequelize = require("../../../lib/database");
const BaseGeoService = require("../baseGeo.service");

class GridService extends BaseGeoService {

    constructor(wgs84, utmZone, gridSize, bounds) {
        super(wgs84, utmZone, gridSize, bounds);
    }

    async saveGridCells(gridCells) {
        try {
            await GridCell.bulkCreate(gridCells, {
                updateOnDuplicate: ["xMin", "yMin", "xMax", "yMax", "latitude", "longitude"],
            });

            console.log(`Đã lưu ${gridCells.length} ô lưới.`);
        } catch (error) {
            console.error("Lỗi khi lưu các ô lưới:", error);
        }
    }


    async generateGridAndSave() {
        var openLocationCode = new OpenLocationCode();
        const { latMin, latMax, longMin, longMax } = this.bounds;

        // VD: 500m = 500 / 111000 = 0.0045 độ
        const step = Number((this.gridSize / GridService.ArcDegreeOnEarthSurface).toFixed(4));

        let gridCells = []; // Mảng chứa dữ liệu các ô lưới
        const batchSize = 1000;

        for (let lat = latMin; lat <= latMax; lat += step) {
            for (let long = longMin; long <= longMax; long += step) {
                const [utmX, utmY] = this.convertLatLongToUTM(lat, long);

                const { gridX, gridY } = this.getGridIndex(utmX, utmY);
                const xMin = gridX * this.gridSize;
                const yMin = gridY * this.gridSize;
                const xMax = xMin + this.gridSize;
                const yMax = yMin + this.gridSize;

                const utmXCenter = (xMin + xMax) / 2;
                const utmYCenter = (yMin + yMax) / 2;

                const [longitude, latitude] = proj4(this.utmZone, this.wgs84, [utmXCenter, utmYCenter]);
                const name = openLocationCode.encode(latitude, longitude);
                gridCells.push({
                    name,
                    gridX,
                    gridY,
                    xMin,
                    yMin,
                    xMax,
                    yMax,
                    latitude,
                    longitude,
                });


                if (gridCells.length >= batchSize) {
                    await this.saveGridCells(gridCells);
                    gridCells = [];
                }
            }
        }

        if (gridCells.length > 0) {
            await this.saveGridCells(gridCells);
        }

        console.log("Đã hoàn thành việc chia và lưu các ô lưới.");
    }
}

module.exports = GridService;
