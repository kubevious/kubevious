const logger = require('./logger');
logger.info("init");

const MysqlDriver = require("./lib/utils/mysql-driver");
var mysqldriver = new MysqlDriver(logger);
mysqldriver.prepareStatement('GET_SNAPSHOTS', 'SELECT * FROM snapshots;');
mysqldriver.prepareStatement('GET_DIFFS', 'SELECT * FROM diffs;');
mysqldriver.connect()

mysqldriver.onConnect(() => {
    logger.info("!!! CONNECTED");
    mysqldriver.executeStatement('GET_SNAPSHOTS')
        .then((results) => {
            logger.info("!!! GET_SNAPSHOTS RESULT: ", results);
        })
        .catch(reason => {
            logger.error("!!! ERROR: ", reason);
        })
})
    // .then(() => {
    //     logger.info("END.");
    // })