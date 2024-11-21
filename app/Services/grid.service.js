const proj4 = require("proj4");
const GridCell = require("../Models/GridCell.model");
const sequelize = require("../../lib/database");

class GridService {

    // Cung Độ trên Bề Mặt Địa Cầu (Arc Degree on Earth's Surface)
    static ArcDegreeOnEarthSurface = 111000;

    constructor(wgs84, utmZone, gridSize, bounds) {
        this.wgs84 = wgs84;
        this.utmZone = utmZone;
        this.gridSize = gridSize;
        this.bounds = bounds;
    }

    // Chuyển đổi tọa độ từ WGS84 sang UTM
    convertLatLongToUTM(lat, long) {
        return proj4(this.wgs84, this.utmZone, [long, lat]);
    }

    // Tính chỉ số ô lưới dựa trên tọa độ UTM
    getGridIndex(utmX, utmY) {
        const gridX = Math.floor(utmX / this.gridSize);
        const gridY = Math.floor(utmY / this.gridSize);
        return { gridX, gridY };
    }

    // Lưu thông tin ô lưới vào cơ sở dữ liệu
    async saveGridCell(gridX, gridY, xMin, yMin, xMax, yMax) {
        try {
            // Tìm hoặc tạo ô lưới
            const [gridCell, created] = await GridCell.findOrCreate({
                where: { gridX, gridY },
                defaults: { xMin, yMin, xMax, yMax },
            });

            if (created) {
                console.log(`Ô lưới (${gridX}, ${gridY}) đã được tạo.`);
            } else {
                console.log(`Ô lưới (${gridX}, ${gridY}) đã tồn tại.`);
            }
        } catch (error) {
            console.error(`Lỗi khi lưu ô lưới (${gridX}, ${gridY}):`, error);
        }
    }

    // Tạo và lưu các ô lưới dựa trên phạm vi tọa độ
    async generateGridAndSave() {
        const { latMin, latMax, longMin, longMax } = this.bounds;

        // VD: 500m = 500 / 111000 = 0.0045 độ
        var step = Number((this.gridSize / GridService.ArcDegreeOnEarthSurface).toFixed(4));

        for (let lat = latMin; lat <= latMax; lat += step) {
            for (let long = longMin; long <= longMax; long += step) {
                // Chuyển đổi tọa độ từ WGS84 sang UTM
                const [utmX, utmY] = this.convertLatLongToUTM(lat, long);

                // Tính toán chỉ số ô lưới và tọa độ góc
                const { gridX, gridY } = this.getGridIndex(utmX, utmY);
                const xMin = gridX * this.gridSize;
                const yMin = gridY * this.gridSize;
                const xMax = xMin + this.gridSize;
                const yMax = yMin + this.gridSize;

                // Lưu ô lưới vào cơ sở dữ liệu
                await this.saveGridCell(gridX, gridY, xMin, yMin, xMax, yMax);
            }
        }

        console.log("Đã hoàn thành việc chia và lưu các ô lưới.");
    }
}

module.exports = GridService;
