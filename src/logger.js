var config = {
    pretty: true
}

if (process.env.LOG_TO_FILE) {
    config.enableFile = true;
    config.cleanOnStart = true;
}

const logger = require('the-logger').setup('kubevious', config);
logger.level = 'debug';

module.exports = logger;