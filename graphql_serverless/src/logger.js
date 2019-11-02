const pino = require('pino');
const path = require('path');
const options = {
    base: null, // Set to null to avoid adding pid, hostname and name properties to each log.
    timestamp: () => `, "time": ${new Date().toISOString()}`
};

if (process.env !== 'prod') {
    options.prettyPrint = {
        colorize: true
    };
    options.level = 'trace';
}

// module.exports = pino(options, pino.destination(path.resolve(__dirname, '../logs')));
module.exports = pino(options);
