const { DataTypes } = require('sequelize');
const sequelize = require('../../lib/database');

const Distance = sequelize.define('Distance', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    pickup_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'A',
    },
    grid_cell_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'B',
    },
    distance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Khoảng cách A -> B (m)',
    },
    reverse_distance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'B -> A (m)',
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'distances',
    timestamps: false,
    indexes: [
        {
            name: 'idx_pickup_location_id',
            using: 'BTREE',
            fields: ['pickup_location_id'],
        },
        {
            name: 'idx_grid_cell_id',
            using: 'BTREE',
            fields: ['grid_cell_id'],
        },
    ],
});

module.exports = Distance;
