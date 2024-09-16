const { DataTypes } = require('sequelize');
const sequelize = require('../../lib/database');

// Định nghĩa model Ward cho bảng wards
const Ward = sequelize.define('Ward', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    type: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    district_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    longitude: {
        type: DataTypes.DECIMAL(15, 7),
        allowNull: true
    },
    latitude: {
        type: DataTypes.DECIMAL(15, 7),
        allowNull: true
    },
    code_px: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'wards',
    timestamps: false, // Không sử dụng các cột createdAt, updatedAt
    indexes: [
        {
            fields: ['type'],
            using: 'BTREE',
            name: 'wards_type_index'
        },
        {
            fields: ['district_id'],
            using: 'BTREE',
            name: 'wards_district_id_index'
        }
    ]
});

module.exports = Ward;
