require('dotenv').config({path: '../../.env'});
const {convertWGS84ToUTM} = require('../../app/Helpers/base.helper')
const FindGridService = require('../../app/Services/Geo/findGrid.service');
const GridCell = require('../../app/Models/GridCell.model');

const wgs84 = process.env.WGS84;
const utmZone = process.env.UTM_ZONE;
const gridSize = parseInt(process.env.GRID_SIZE);

const findGridService = new FindGridService(wgs84, utmZone, gridSize);

const latitude = 16.033883;
const longitude = 108.179645;

//16.033883, 108.179645

(async () => {
    const [utmX, utmY] = findGridService.convertLatLongToUTM(latitude, longitude);
    console.log(`Tọa độ UTM của điểm: X = ${utmX}, Y = ${utmY}`);

    const gridIndex = findGridService.getGridIndex(utmX, utmY);
    console.log(`Điểm thuộc về ô lưới có chỉ số: (${gridIndex.gridX}, ${gridIndex.gridY})`);

    const cell = await GridCell.findOne({
        where: {
            gridX: gridIndex.gridX,
            gridY: gridIndex.gridY,
        },
    });

    console.log(`Cell in database: ${JSON.stringify(cell)}`);
})();

// console.log(`Cell in database:  ${cell}` );
