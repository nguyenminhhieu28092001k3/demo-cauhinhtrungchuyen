const { DataTypes } = require('sequelize');
const sequelize = require('../../lib/database');

const PickupLocationTransShipment = sequelize.define('PickupLocationTransShipment', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    from_pickup_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    to_pickup_location_id: {
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
    tableName: 'pickup_location_trans_shipments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            name: 'from_to_pickup_location_id_index',
            unique: true,
            using: 'BTREE',
            fields: ['from_pickup_location_id', 'to_pickup_location_id'],
        },
        {
            name: 'trans_shipment_id_index',
            fields: ['trans_shipment_id'],
        },
    ]
});

module.exports = PickupLocationTransShipment;
