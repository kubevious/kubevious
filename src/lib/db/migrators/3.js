module.exports = function(logger, driver) {
    logger.info("MIGRATING v3");

    var sql = "" + 
    "CREATE TABLE IF NOT EXISTS `policies` (" + 
        "`id` int unsigned NOT NULL AUTO_INCREMENT," + 
        "`name` varchar(128) NOT NULL," + 
        "`script` TEXT NOT NULL," + 
        "PRIMARY KEY (`id`)" + 
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"
    ;

    return driver.executeSql(sql);
}