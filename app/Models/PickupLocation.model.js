const { DataTypes } = require('sequelize');
const sequelize = require('../../lib/database');

const PickupLocation = sequelize.define('PickupLocation', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    sender_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci',
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci',
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci',
    },
    city_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    district_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    ward_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    note: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci',
    },
    grand_opening_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: 1,
    },
    edited_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    longitude: {
        type: DataTypes.DECIMAL(15, 7),
        allowNull: true,
    },
    latitude: {
        type: DataTypes.DECIMAL(15, 7),
        allowNull: true,
    },
    sender_flag: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 2,
    },
    zone: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        defaultValue: 1,
    },
    pickup_radius: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    ip_address: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci',
    },
    inside_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    inside_address: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci',
    },
    location_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    support_cities: {
        type: DataTypes.TEXT,
        allowNull: true,
        collate: 'utf8mb4_unicode_ci',
    },
    type: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
    },
    is_monitoring: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
    },
    info_monitoring: {
        type: DataTypes.TEXT,
        allowNull: true,
        collate: 'utf8mb4_unicode_ci',
    },
    is_confirm: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
    },
    info_confirm: {
        type: DataTypes.TEXT,
        allowNull: true,
        collate: 'utf8mb4_unicode_ci',
    },
    area: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
    },
    is_transshipment: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: 2,
    },
    is_router: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: true,
        defaultValue: 2,
    },
    frenquency: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
    },
    inside_store_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
}, {
    tableName: 'pickup_locations',
    timestamps: false, // Không sử dụng createdAt và updatedAt
    indexes: [
        {
            name: 'pickup_locations_sender_id_index',
            using: 'BTREE',
            fields: ['sender_id'],
        },
        {
            name: 'pickup_locations_city_id_index',
            using: 'BTREE',
            fields: ['city_id'],
        },
        {
            name: 'pickup_locations_district_id_index',
            using: 'BTREE',
            fields: ['district_id'],
        },
        {
            name: 'pickup_locations_ward_id_index',
            using: 'BTREE',
            fields: ['ward_id'],
        },
        {
            name: 'pickup_locations_status_index',
            using: 'BTREE',
            fields: ['status'],
        },
        {
            name: 'pickup_locations_inside_id_index',
            using: 'BTREE',
            fields: ['inside_id'],
        },
    ],
});

module.exports = PickupLocation;
