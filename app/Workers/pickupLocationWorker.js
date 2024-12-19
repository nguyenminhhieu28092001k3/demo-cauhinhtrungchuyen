const { parentPort, workerData } = require('worker_threads');
const FindPickupLocationTransshipmentPointService = require('../Services/pickupLocationTransShipments.service');

// Nếu là Worker, thực hiện công việc tính toán
if (parentPort) {
    (async () => {
        try {
            const result = await (new FindPickupLocationTransshipmentPointService()).execute(workerData);
            parentPort.postMessage(result);
        } catch (error) {
            parentPort.postMessage({ error: error.message });
        }
    })();
}