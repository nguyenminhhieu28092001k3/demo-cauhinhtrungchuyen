const proj4 = require("proj4");

/**
 * Hàm chuyển đổi từ tọa độ WGS84 sang tọa độ UTM.
 * @param {number} latitude - Vĩ độ (latitude) theo WGS84.
 * @param {number} longitude - Kinh độ (longitude) theo WGS84.
 * @param {string} utmZone - EPSG code của hệ UTM (ví dụ: "EPSG:32633" cho Zone 33N).
 * @returns {object} - Tọa độ UTM với định dạng { x, y }.
 */
function convertWGS84ToUTM(latitude, longitude, utmZone) {
    // Định nghĩa hệ tọa độ WGS84 và UTM zone
    const wgs84 = proj4("EPSG:4326");
    const utm = proj4(utmZone);

    // Chuyển đổi tọa độ
    const [x, y] = proj4(wgs84, utm, [longitude, latitude]);

    // Trả về kết quả
    return { x, y };
}

// Ví dụ sử dụng hàm
// const latitude = 40.748817; // Vĩ độ
// const longitude = -73.985428; // Kinh độ
// const utmZone33N = "EPSG:32633"; // UTM Zone 33N
//
// const result = convertWGS84ToUTM(latitude, longitude, utmZone33N);
// console.log(`UTM X: ${result.x}, UTM Y: ${result.y}`);




module.exports = {
    convertWGS84ToUTM
};
