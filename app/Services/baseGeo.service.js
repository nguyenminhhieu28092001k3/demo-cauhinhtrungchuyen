const proj4 = require("proj4");

class BaseGeoService {

    // Cung Độ trên Bề Mặt Địa Cầu (Arc Degree on Earth's Surface)
    static ArcDegreeOnEarthSurface = 111000;

    constructor(wgs84, utmZone, gridSize, bounds = null) {
        this.wgs84 = wgs84;
        this.utmZone = utmZone;
        this.gridSize = gridSize;
        this.bounds = bounds;
    }

    // Phương thức chuyển đổi từ tọa độ địa lý (latitude, longitude) sang UTM
    convertLatLongToUTM(lat, long) {
        return proj4(this.wgs84, this.utmZone, [long, lat]);
    }

    // Phương thức tính chỉ số ô lưới dựa trên tọa độ UTM
    getGridIndex(utmX, utmY) {
        const gridX = Math.floor(utmX / this.gridSize);
        const gridY = Math.floor(utmY / this.gridSize);
        return {gridX, gridY};
    }
}

module.exports = BaseGeoService;
