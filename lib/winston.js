'use strict';
const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

// Cấu hình chung cho logger
const LOG_DIR = path.resolve(__dirname, '../storage/logs/');
const MAX_SIZE = '50m';
const MAX_FILES = '30d';
const DATE_PATTERN = 'YYYY-MM-DD-HH';

// Định dạng log chung
const logFormat = winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS A' }),
    winston.format.printf((info) => {
        if (info.stack) return `[${info.timestamp}] [${info.level}]: ${info.stack}`;
        return `[${info.timestamp}] [${info.level}]: ${info.message}`;
    })
);

// Hàm tạo logger
const createLogger = (level, filename) => {
    return winston.createLogger({
        defaultMeta: { service: 'log-service' },
        format: logFormat,
        transports: [
            new winston.transports.Console({
                format: winston.format.colorize({ all: true }),
            }),
            new winston.transports.DailyRotateFile({
                level: level,
                dirname: LOG_DIR,
                filename: `${filename}-%DATE%.log`,
                datePattern: DATE_PATTERN,
                zippedArchive: true,
                maxSize: MAX_SIZE,
                maxFiles: MAX_FILES,
            }),
        ],
    });
};

// Tạo các loggers
const infoLogger = createLogger('info', 'info');
const debugLogger = createLogger('debug', 'debug');
const errorLogger = createLogger('error', 'error');

// Hàm parse log
const parseLogs = (key, params) => {
    if (typeof key === 'object') key = JSON.stringify(key);
    return params !== undefined ? `${key}: ${JSON.stringify(params)}` : key;
};

// Xuất các hàm log
module.exports = {
    info: (key, params) => infoLogger.info(parseLogs(key, params)),
    debug: (key, params) => debugLogger.debug(parseLogs(key, params)),
    error: (key, params) => errorLogger.error(parseLogs(key, params)),
};


// Example
// const logger = require('../../lib/winston');
// logger.info('Server started', { port: 3000, env: 'production' });
// logger.debug('Debugging API call', { endpoint: '/api/v1/user', method: 'GET' });
// logger.error('Debugging API call', { endpoint: '/api/v1/user', method: 'GET' });


