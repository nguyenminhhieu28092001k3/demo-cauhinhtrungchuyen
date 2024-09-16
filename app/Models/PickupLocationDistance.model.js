const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Định nghĩa model PickupLocationDistance cho bảng pickup_location_distances
const PickupLocationDistance = sequelize.define('PickupLocationDistance', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    from_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    to_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    distance: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    active: {
        type: DataTypes.TINYINT,
        defaultValue: 1
    },
    path: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: ''
    },
    is_edit: {
        type: DataTypes.TINYINT,
        defaultValue: 0
    }
}, {
    tableName: 'pickup_location_distances',
    timestamps: false, // Không sử dụng các cột createdAt, updatedAt
    indexes: [
        {
            unique: true,
            fields: ['from_location_id', 'to_location_id'],
            using: 'BTREE',
            name: 'pickup_location_distances_from_location_id_to_location_id_index'
        },
        {
            fields: ['from_location_id'],
            using: 'BTREE',
            name: 'pickup_location_distances_from_location_id_index'
        },
        {
            fields: ['to_location_id'],
            using: 'BTREE',
            name: 'pickup_location_distances_to_location_id_index'
        },
        {
            fields: ['active'],
            using: 'BTREE',
            name: 'pickup_location_distances_active_index'
        }
    ]
});

module.exports = PickupLocationDistance;
