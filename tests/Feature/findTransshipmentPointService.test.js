const FindTransshipmentPointService = require('../../app/Services/transShipments.service');

const workerData = {
    receiverWardId: 10168,  // ID của phường người nhận
    pickupLocationId: 15 // ID của điểm lấy hàng
};

const service = new FindTransshipmentPointService();
service.execute(workerData)
    .then(result => {
        console.log(result)
    })
    .catch(error => {
        console.error("Lỗi xảy ra:", error);
    });