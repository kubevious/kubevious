const logger = require('the-logger').setup('kubevious', {
    enableFile: true,
    cleanOnStart: true,
    pretty: true
});
logger.level = 'debug';

module.exports = logger;