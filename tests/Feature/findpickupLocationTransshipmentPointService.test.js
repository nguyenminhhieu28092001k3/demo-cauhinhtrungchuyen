const FindPickupLocationTransshipmentPointService = require('../../app/Services/pickupLocationTransShipments.service');

(async () => {
    try {
        const transshipmentService = new FindPickupLocationTransshipmentPointService();
        const transShipmentId = await transshipmentService.execute({
            fromPickupLocationId: 24,
            toPickupLocationId: 13,
        });

        console.log('logs', transShipmentId);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
})();
