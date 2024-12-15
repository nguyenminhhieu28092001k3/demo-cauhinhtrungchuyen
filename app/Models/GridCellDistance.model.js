const { DataTypes } = require('sequelize');
const sequelize = require('../../lib/database');

const GridCellDistance = sequelize.define('grid_cell_distance', {
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
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Khoảng cách A -> B (m)',
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
    tableName: 'grid_cell_distances',
    timestamps: false,
    indexes: [
        {
            name: 'pickup_location_id_grid_cell_id_index',
            using: 'BTREE',
            unique: true,
            fields: ['pickup_location_id', 'grid_cell_id'],
        }
    ],
});

module.exports = GridCellDistance;
