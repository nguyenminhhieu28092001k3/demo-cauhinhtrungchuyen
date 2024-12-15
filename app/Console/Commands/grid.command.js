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
    process.exit();
}

const handleCalculateGridCellDistances = async (args) => {
    const controller = new GridController();
    const pickupLocationId = args.pickupId;

    try {
        await controller.calculateAndSaveGridCellDistances(pickupLocationId);
        console.log(
            `Successfully calculated and saved grid cell distances for PickupLocation ID: ${pickupLocationId}`
        );
        process.exit();
    } catch (error) {
        console.error(
            `Error while calculating grid cell distances for PickupLocation ID ${pickupLocationId}:`,
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
        handleCalculateGridCellDistances
    )
    .help()
    .alias("help", "h")
    .demandCommand(1, "You need to specify a command.")
    .argv;


// 1. Tạo ô
// VD: node grid.command.js generate -b "15.9085,16.2193,107.7896,108.3424"

//2. Tính khoảng cách
// VD: node grid.command.js calculateDistances -p 1


// List pickup đà nẵng
// node grid.command.js calculateDistances -p 80
// node grid.command.js calculateDistances -p 630
// node grid.command.js calculateDistances -p 695
// node grid.command.js calculateDistances -p 987
// node grid.command.js calculateDistances -p 989
// node grid.command.js calculateDistances -p 1042
// node grid.command.js calculateDistances -p 1087
