/**
 * Tính khoảng cách giữa hai điểm dựa trên kinh độ và vĩ độ bằng công thức Haversine.
 * @param {number} fromLng - Kinh độ của điểm xuất phát.
 * @param {number} fromLat - Vĩ độ của điểm xuất phát.
 * @param {number} toLng - Kinh độ của điểm đích.
 * @param {number} toLat - Vĩ độ của điểm đích.
 * @returns {number} - Khoảng cách giữa hai điểm tính bằng km.
 */
function calculateKilometerByCoordinate(fromLng, fromLat, toLng, toLat) {
    // Bán kính trái đất (km)
    const R = 6371;

    // Chuyển độ sang radian
    const fromLatRad = degreesToRadians(fromLat);
    const fromLngRad = degreesToRadians(fromLng);
    const toLatRad = degreesToRadians(toLat);
    const toLngRad = degreesToRadians(toLng);

    // Tính khoảng cách
    const dLat = toLatRad - fromLatRad;
    const dLng = toLngRad - fromLngRad;

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Chuyển độ sang radian.
 * @param {number} degrees - Giá trị góc tính bằng độ.
 * @returns {number} - Giá trị góc tính bằng radian.
 */
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

module.exports = calculateKilometerByCoordinate;

// Tọa độ của hai điểm
// const fromLng = 106.6297;  // Kinh độ của Hà Nội
// const fromLat = 10.7626;   // Vĩ độ của Hà Nội
//
// const toLng = 108.2454;    // Kinh độ của Hồ Chí Minh
// const toLat = 11.7500;     // Vĩ độ của Hồ Chí Minh
//
// // Tính khoảng cách
// const distance = calculateKilometerByCoordinate(fromLng, fromLat, toLng, toLat);
