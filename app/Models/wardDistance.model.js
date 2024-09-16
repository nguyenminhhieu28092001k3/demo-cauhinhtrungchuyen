const { DataTypes } = require('sequelize');
const sequelize = require('../../lib/database');

// Định nghĩa model WardDistance cho bảng `ward_distances`
const WardDistance = sequelize.define('WardDistance', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    ward_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    pickup_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    distance: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    reverse_distance: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    tableName: 'ward_distances',
    timestamps: false, // Không sử dụng các cột createdAt, updatedAt
    indexes: [
        {
            unique: true,
            fields: ['ward_id', 'pickup_location_id'],
            using: 'BTREE',
            name: 'ward_distances_ward_id_pickup_location_id_index'
        }
    ]
});

module.exports = WardDistance;
