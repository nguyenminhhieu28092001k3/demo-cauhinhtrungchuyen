const { DataTypes } = require('sequelize');
const sequelize = require('../../lib/database');

const GridCellTransShipment = sequelize.define('GridCellTransShipment', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    pickup_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    grid_cell_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    trans_shipment_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'grid_cell_trans_shipments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            name: 'pickup_location_id_grid_cell_id_index',
            unique: true,
            using: 'BTREE',
            fields: ['pickup_location_id', 'grid_cell_id'],
        },
        {
            name: 'trans_shipment_id_index',
            fields: ['trans_shipment_id'],
        },
    ]
});

module.exports = GridCellTransShipment;
