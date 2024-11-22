const proj4 = require("proj4");
const BaseGeoService = require("../baseGeo.service");

// Định nghĩa class FindGridService
class FindGridService extends BaseGeoService {
    constructor(wgs84, utmZone, gridSize) {
        super(wgs84, utmZone, gridSize);
    }
}

module.exports = FindGridService;