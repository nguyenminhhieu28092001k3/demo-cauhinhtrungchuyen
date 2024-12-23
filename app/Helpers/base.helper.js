const proj4 = require("proj4");
const fs = require('fs');
const path = require('path');
const {Op} = require("sequelize");
const PickupLocation = require("../Models/PickupLocation.model");

function changePlacesDegrees(toaDo) {
    let [kinhDo, viDo] = toaDo.split(',');
    return `${viDo},${kinhDo}`;
}

function getVietnamTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const formatted = formatter.format(now);
    return formatted.replace(',', ''); // Kết quả: "dd/mm/yyyy HH:mm:ss"
}

function convertWGS84ToUTM(latitude, longitude, utmZone) {
    // Định nghĩa hệ tọa độ WGS84 và UTM zone
    const wgs84 = proj4("EPSG:4326");
    const utm = proj4(utmZone);

    // Chuyển đổi tọa độ
    const [x, y] = proj4(wgs84, utm, [longitude, latitude]);

    // Trả về kết quả
    return { x, y };
}

function getLogFilePath(name = 'mysql_logs') {
    if (typeof name === 'object') {
        name = 'mysql_logs';
    }
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0]; // Lấy ngày dạng YYYY-MM-DD
    const nameFull =  `${formattedDate}_${name}.log`;
    return path.join(__dirname, `../../storage/logs/${nameFull}`);
}

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

function logToFile(msg, fileName) {

    const logFilePath = getLogFilePath(fileName);
    ensureDirectoryExistence(logFilePath);

    const logMessage = `${getVietnamTime()} - ${msg}\n`;

    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
}

// Hàm lấy danh sách pickup location ID
async function getPickupLocationIdsTransShipment() {
    const lstPickupLocation = await PickupLocation.findAll({
        raw: true,
        attributes: ['id'],
        where: { transshipment_status: 1 },
    });
    return lstPickupLocation.map(location => location.id);
}

// Hàm tạo điều kiện WHERE
function buildWhereCondition(pickupLocationIds) {
    return {
        [Op.and]: [
            { from_location_id: { [Op.in]: pickupLocationIds } },
            { to_location_id: { [Op.in]: pickupLocationIds } },
        ],
    };
}

// Ví dụ sử dụng hàm
// const latitude = 40.748817; // Vĩ độ
// const longitude = -73.985428; // Kinh độ
// const utmZone33N = "EPSG:32633"; // UTM Zone 33N
//
// const result = convertWGS84ToUTM(latitude, longitude, utmZone33N);
// console.log(`UTM X: ${result.x}, UTM Y: ${result.y}`);





module.exports = {
    convertWGS84ToUTM,
    logToFile,
    changePlacesDegrees,
    getPickupLocationIdsTransShipment,
    buildWhereCondition
};
