const logger = require('the-logger').setup('appview', {
    enableFile: true,
    cleanOnStart: true,
    pretty: true
});
logger.level = 'debug';

module.exports = logger;