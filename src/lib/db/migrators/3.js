const Promise = require('the-promise');

module.exports = function(logger, driver) {
    logger.info("MIGRATING v3");

    var queryies = [

    "CREATE TABLE IF NOT EXISTS `rules` (" +
        "`name` varchar(128) NOT NULL," +
        "`enabled` TINYINT NOT NULL," +
        "`date` DATETIME NOT NULL," +
        " `target` TEXT NOT NULL," +
        "`script` TEXT NOT NULL," +
        "`hash` BINARY(32) NULL," +
        "PRIMARY KEY (`name`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"

    ,

    "CREATE TABLE IF NOT EXISTS `rule_statuses` (" +
        "`id` int unsigned NOT NULL AUTO_INCREMENT," +
        "`rule_name` varchar(128) NOT NULL," +
        "`hash` BINARY(32) NOT NULL," +
        "`date` DATETIME NOT NULL," +
        "`error_count` int unsigned NOT NULL," +
        "`item_count` int unsigned NOT NULL," +
        "PRIMARY KEY (`id`)," +
        "KEY `rule_name` (`rule_name`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"

    ,

    "CREATE TABLE IF NOT EXISTS `rule_logs` (" +
        "`id` int unsigned NOT NULL AUTO_INCREMENT," +
        "`rule_name` varchar(128) NOT NULL," +
        "`kind` varchar(128) NOT NULL," +
        "`msg` json NOT NULL," +
        "PRIMARY KEY (`id`)," +
        "KEY `rule_name` (`rule_name`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;" 

    ,

    "CREATE TABLE IF NOT EXISTS `rule_items` (" +
        "`id` int unsigned NOT NULL AUTO_INCREMENT," +
        "`rule_name` varchar(128) NOT NULL," +
        "`dn` varchar(1024) NOT NULL," +
        "`errors` int unsigned NOT NULL," +
        "`warnings` int unsigned NOT NULL," +
        "`markers` json NULL," +
        "PRIMARY KEY (`id`)," +
        "KEY `rule_name` (`rule_name`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;"

    ,


    "CREATE TABLE IF NOT EXISTS `markers` (" +
        "`name` varchar(128) NOT NULL," +
        "`shape` varchar(128) NOT NULL," +
        "`color` varchar(128) NOT NULL," +
        "`propagate` TINYINT NOT NULL," +
        "PRIMARY KEY (`name`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;" 

    ,

    "CREATE TABLE IF NOT EXISTS `marker_items` (" +
        "`id` int unsigned NOT NULL AUTO_INCREMENT," +
        "`marker_name` varchar(128) NOT NULL," +
        "`dn` varchar(1024) NOT NULL," +
        "PRIMARY KEY (`id`)," +
        "KEY `marker_name` (`marker_name`)" +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1;" 

    ];

    return Promise.serial(queryies, x => driver.executeSql(x));
}