const {Op} = require("sequelize");
const PickupLocation = require("../Models/PickupLocation.model");

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

module.exports = {
    getPickupLocationIdsTransShipment,
    buildWhereCondition
};
