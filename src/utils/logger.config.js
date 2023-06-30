const { createLogger, transports, format } = require('winston');

const logConfiguration = createLogger({
    transports: [
        new transports.Console(),
        new transports.File({
            filename: 'logs/server.log'
        })],
    format: format.combine(
        format.timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }),
        format.align(),
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`)
    )
});

module.exports = logConfiguration;