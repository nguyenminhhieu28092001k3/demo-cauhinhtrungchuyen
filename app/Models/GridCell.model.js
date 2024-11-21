const { DataTypes } = require('sequelize');
const sequelize = require('../../lib/database');

const GridCell = sequelize.define('GridCell', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    gridX: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    gridY: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    xMin: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    yMin: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    xMax: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    yMax: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
}, {
    tableName: 'grid_cells',
    timestamps: false,
    indexes: [
        {
            name: 'grid_cells_gridX_gridY_index',
            using: 'BTREE',
            fields: ['gridX', 'gridY'],
        },
    ],
});

module.exports = GridCell;
