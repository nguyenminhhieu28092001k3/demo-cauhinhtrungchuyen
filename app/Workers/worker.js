const { parentPort, workerData } = require('worker_threads');
const FindTransshipmentPointService = require('../Services/transShipments.service');

// Nếu là Worker, thực hiện công việc tính toán
if (parentPort) {
    (async () => {
        try {
            const result = await (new FindTransshipmentPointService()).execute(workerData);
            parentPort.postMessage(result);
        } catch (error) {
            parentPort.postMessage({ error: error.message });
        }
    })();
}