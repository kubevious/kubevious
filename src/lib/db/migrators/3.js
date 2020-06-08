const Promise = require('the-promise');

module.exports = function(logger, driver) {
    logger.info("MIGRATING v3");

    var queryies = [

    "CREATE TABLE IF NOT EXISTS `rules` (" + 
        "`id` int unsigned NOT NULL AUTO_INCREMENT," +
        "`name` varchar(128) NOT NULL," + 
        "`enabled` TINYINT NOT NULL," +
        "`date` DATETIME NOT NULL," +
        "`target` TEXT NOT NULL," +
        "`script` TEXT NOT NULL," +
        "`hash` BINARY(32) NULL," + 
        "PRIMARY KEY (`id`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"

    ,

    "CREATE TABLE IF NOT EXISTS `rule_statuses` (" +
        "`id` int unsigned NOT NULL AUTO_INCREMENT," +
        "`rule_id` int unsigned NOT NULL," +
        "`hash` BINARY(32) NOT NULL," +
        "`date` DATETIME NOT NULL," +
        "`error_count` int unsigned NOT NULL," +
        "`item_count` int unsigned NOT NULL," +
        "PRIMARY KEY (`id`)," +
        "KEY `rule_id` (`rule_id`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"

    ,

    "CREATE TABLE IF NOT EXISTS `rule_logs` (" +
        "`id` int unsigned NOT NULL AUTO_INCREMENT," +
        "`rule_id` int unsigned NOT NULL," +
        "`kind` varchar(128) NOT NULL," +
        "`msg` json NOT NULL," +
        "PRIMARY KEY (`id`)," + 
        "KEY `rule_id` (`rule_id`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"

    ,

    "CREATE TABLE IF NOT EXISTS `rule_items` (" +
        "`id` int unsigned NOT NULL AUTO_INCREMENT," +
        "`rule_id` int unsigned NOT NULL," +
        "`dn` varchar(1024) NOT NULL," + 
        "`has_error` TINYINT NOT NULL," +
        "`has_warning` TINYINT NOT NULL," +
        "`markers` json NULL," +
        "PRIMARY KEY (`id`)," + 
        "KEY `rule_id` (`rule_id`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"

    ,

    "CREATE TABLE IF NOT EXISTS `markers` (" + 
        "`id` int unsigned NOT NULL AUTO_INCREMENT," +
        "`name` varchar(128) NOT NULL," + 
        "`shape` varchar(128) NOT NULL," + 
        "`color` varchar(128) NOT NULL," + 
        "`propagate` TINYINT NOT NULL," +
        "PRIMARY KEY (`id`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"

    ,

    "CREATE TABLE IF NOT EXISTS `marker_items` (" +
        "`id` int unsigned NOT NULL AUTO_INCREMENT," +
        "`marker_id` int unsigned NOT NULL," +
        "`dn` varchar(1024) NOT NULL," + 
        "PRIMARY KEY (`id`)," + 
        "KEY `marker_id` (`marker_id`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"


    ];

    return Promise.serial(queryies, x => driver.executeSql(x));
}