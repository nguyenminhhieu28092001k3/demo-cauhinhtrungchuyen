require('dotenv').config({path: '../../.env'});
const {convertWGS84ToUTM} = require('../../app/Helpers/base.helper')
const FindGridService = require('../../app/Services/Geo/findGrid.service');

const wgs84 = process.env.WGS84;
const utmZone = process.env.UTM_ZONE;
const gridSize = process.env.GRID_SIZE;

const findGridService = new FindGridService(wgs84, utmZone, gridSize);

const latitude = 10.823069;
const longitude = 106.634801;

const [utmX, utmY] = findGridService.convertLatLongToUTM(latitude, longitude);
console.log(`Tọa độ UTM của điểm: X = ${utmX}, Y = ${utmY}`);

const gridIndex = findGridService.getGridIndex(utmX, utmY);
console.log(`Điểm thuộc về ô lưới có chỉ số: (${gridIndex.gridX}, ${gridIndex.gridY})`);
