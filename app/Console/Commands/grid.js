#!/usr/bin/env node
const yargs = require("yargs");
require('dotenv').config({path: '../../../.env'});
const GridController = require("../../Http/Controllers/grid.controller");

const handleGenerateCommand  = async (args) => {
    const controller = new GridController();

    const boundsArray = args.bounds.split(",").map(Number);
    if (boundsArray.length !== 4) {
        console.error(
            "Invalid bounds format. Expected: 'latMin,latMax,longMin,longMax'."
        );
        process.exit(1);
    }
    const bounds = {
        latMin: boundsArray[0],
        latMax: boundsArray[1],
        longMin: boundsArray[2],
        longMax: boundsArray[3],
    };

    const wgs84 = process.env.WGS84;
    const utmZone = process.env.UTM_ZONE;
    const gridSize = parseInt(process.env.GRID_SIZE);

    await controller.generateAndSaveGrid(
        wgs84,
        utmZone,
        gridSize,
        bounds
    );
}

const handleCalculateDistances = async (args) => {
    const controller = new GridController();
    const pickupLocationId = args.pickupId;

    try {
        await controller.calculateAndSaveDistances(pickupLocationId);
        console.log(
            `Successfully calculated and saved distances for PickupLocation ID: ${pickupLocationId}`
        );
    } catch (error) {
        console.error(
            `Error while calculating distances for PickupLocation ID ${pickupLocationId}:`,
            error.message
        );
    }
}

const argv = yargs
    .scriptName("GridCommand")
    .usage("$0 <cmd> [args]")
    .command(
        "generate",
        "Generate and save grid data",
        (yargs) => {
            return yargs
                .option("bounds", {
                    alias: "b",
                    describe: "Bounds of the grid (latMin,latMax,longMin,longMax)",
                    type: "string",
                    demandOption: true,
                });
        },
        handleGenerateCommand
    )
    .command(
        "calculateDistances",
        "Calculate and save distances for a specific Pickup Location",
        (yargs) => {
            return yargs.option("pickupId", {
                alias: "p",
                describe: "ID of the Pickup Location",
                type: "number",
                demandOption: true,
            });
        },
        handleCalculateDistances
    )
    .help()
    .alias("help", "h")
    .demandCommand(1, "You need to specify a command.")
    .argv;


// 1. Tạo ô
// VD: node grid.js generate -b "10.5256,11.0410,106.4616,107.0247"

//2. Tính khoảng cách
// VD: node grid.js calculateDistances -p 1
