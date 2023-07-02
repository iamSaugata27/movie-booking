const { createLogger, transports, format } = require('winston');
const { basename, dirname } = require("path");


const logConfiguration = (module) => {
    var filePath = basename(dirname(module.filename)) + '/' + basename(module.filename);
    return new createLogger({
        transports: [
            new transports.Console(),
            new transports.File({
                filename: 'logs/server.log'
            })],
        format: format.combine(
            format.timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }),
            format.align(),
            // format.colorize({ all: true }),
            format.printf(info => `[${info.timestamp}]: ${info.level}: ${filePath}: ${info.message}`)
        )
    });
}

module.exports = logConfiguration;