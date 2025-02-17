const {logToFile} = require('../app/Helpers/base.helper')
module.exports.option = {
    host: '127.0.0.1',
    dialect: 'mysql',
    pool: {
        max: 50,      // Maximum number of connections in pool
        min: 0,       // Minimum number of connections in pool
        acquire: 30000, // Maximum time (in ms) to wait for a connection
        idle: 10000,   // Time (in ms) before a connection is considered idle
    },
    retry: {
        // match: [/Deadlock/i, /Connection lost/i],
        max: 3,  // Số lần thử lại khi lỗi kết nối
    },
    logging: logToFile,
};
module.exports.DATABASE = 'hasakinow_db';
module.exports.USERNAME = 'root';
module.exports.PASSWORD = 'root@123';
