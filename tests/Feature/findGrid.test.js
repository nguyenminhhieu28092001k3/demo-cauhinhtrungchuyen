const {convertWGS84ToUTM} = require('../../app/Helpers/base.helper')
const FindGridService = require('../../app/Services/findGrid.service');


const wgs84 = "EPSG:4326";
const utmZone48N = "EPSG:32648";
const gridSize = 100;


const findGridService = new FindGridService(wgs84, utmZone48N, gridSize);

const latitude = 10.823485;
const longitude = 106.635601;


const [utmX, utmY] = findGridService.convertLatLongToUTM(latitude, longitude);
console.log(`Tọa độ UTM của điểm: X = ${utmX}, Y = ${utmY}`);


const gridIndex = findGridService.getGridIndex(utmX, utmY);
console.log(`Điểm thuộc về ô lưới có chỉ số: (${gridIndex.gridX}, ${gridIndex.gridY})`);