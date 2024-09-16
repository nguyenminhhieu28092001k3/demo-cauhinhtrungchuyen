const { DataTypes } = require('sequelize');
const sequelize = require('../../lib/database');

const WardTransShipment = sequelize.define('WardTransShipment', {
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
    ward_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    trans_shipment_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    edited_by_user_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Người sửa cấu hình',
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
    tableName: 'ward_trans_shipments_nodejs',
    timestamps: true, // Điều này sẽ tự động tạo createdAt và updatedAt nếu không được chỉ định
    createdAt: 'created_at', // Cột created_at thay cho createdAt mặc định của Sequelize
    updatedAt: 'updated_at', // Cột updated_at thay cho updatedAt mặc định của Sequelize
    indexes: [
        {
            name: 'ward_trans_shipments_pickup_location_id_ward_id_index',
            unique: true,
            fields: ['pickup_location_id', 'ward_id'],
        },
        {
            name: 'ward_trans_shipments_pickup_location_id_index',
            fields: ['pickup_location_id'],
        },
        {
            name: 'ward_trans_shipments_ward_id_index',
            fields: ['ward_id'],
        },
        {
            name: 'ward_trans_shipments_trans_shipment_id_index',
            fields: ['trans_shipment_id'],
        }
    ]
})

module.exports = WardTransShipment;
