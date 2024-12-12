const proj4 = require("proj4");
const axios = require("axios");
const {logToFile, changePlacesDegrees} = require("../Helpers/base.helper");

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

    async callDistanceGoogle(origin, destination, googleApiKey = null) {

        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
                params: {
                    origins: origin,
                    destinations: destination,
                    key: googleApiKey,
                },
            });

            logToFile('[INFO][CALL GOOGLE API] ' + JSON.stringify(response?.data), 'call_api');

            if (
                response?.data?.rows[0]?.elements[0]?.status === 'OK' &&
                response.data.rows[0].elements[0].distance
            ) {
                return response.data.rows[0].elements[0].distance.value; // Khoảng cách (m)
            } else {
                return 0;
            }
        } catch (error) {
            logToFile('[ERROR][CALL GOOGLE API] ' + JSON.stringify(response?.data), 'call_api');
            throw error;
        }
    }

    async callOpenStreetMap(origin, destination) {
        try {

            var pathCreateDegrees = changePlacesDegrees(origin) + ';' + changePlacesDegrees(destination);

            const response = await axios.get('http://router.project-osrm.org/route/v1/driving/'+ pathCreateDegrees, {
                params: {
                    overview: false
                },
            });

            logToFile('[INFO][CALL STREET MAP] ' + JSON.stringify(response?.data), 'call_api');

            if (
                response?.data?.code === 'Ok' &&
                response?.data?.routes[0]?.distance
            ) {
                return response.data.routes[0].distance; // Khoảng cách (m)
            } else {
                return 0;
            }

        } catch (error) {
            logToFile('[ERROR][CALL STREET MAP] ' + JSON.stringify(response?.data), 'call_api');
            throw error;
        }
    }

}

module.exports = BaseGeoService;
