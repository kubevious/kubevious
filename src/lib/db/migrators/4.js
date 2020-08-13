const Promise = require('the-promise');

module.exports = function(logger, driver, executeSql) {
    logger.info("MIGRATING v4.");
    logger.info("Will be dropping history tables.");

    var queryies = [

    "DROP TABLE IF EXISTS `diff_items`",
    "DROP TABLE IF EXISTS `snap_items`",
    "DROP TABLE IF EXISTS `diffs`",
    "DROP TABLE IF EXISTS `snapshots`",
    "DROP TABLE IF EXISTS `config_hashes`"

    ,

    "CREATE TABLE IF NOT EXISTS `config_hashes` ( " +
        "`key` binary(32) NOT NULL DEFAULT '', " +
        "`part` smallint unsigned NOT NULL, " +
        "`value` json NOT NULL, " +
        "PRIMARY KEY (`key`, `part`) " +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1 " +
    "PARTITION BY RANGE (`part`) ( " +
        "PARTITION p0 VALUES LESS THAN (0) " +
    ");"

    ,

    "CREATE TABLE IF NOT EXISTS `snapshots` ( " +
        "`id` int unsigned NOT NULL AUTO_INCREMENT, " +
        "`part` int unsigned NOT NULL, " +
        "`date` datetime NOT NULL, " +
        "PRIMARY KEY (`id`, `part`), " +
        "KEY `date` (`date`) " +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1 " +
    "PARTITION BY RANGE (part) ( " +
        "PARTITION p0 VALUES LESS THAN (0) " +
    ");"

    ,

    "CREATE TABLE IF NOT EXISTS `snap_items` ( " +
        "`id` int unsigned NOT NULL AUTO_INCREMENT, " +
        "`part` int unsigned NOT NULL, " +
        "`snapshot_id` int unsigned NOT NULL, " +
        "`dn` varchar(1024) NOT NULL DEFAULT '', " +
        "`kind` varchar(128) NOT NULL DEFAULT '', " +
        "`config_kind` varchar(128) NOT NULL DEFAULT '', " +
        "`name` varchar(128) NULL DEFAULT '', " +
        "`config_hash_part` smallint unsigned NOT NULL, " +
        "`config_hash` binary(32) NOT NULL, " +
        "PRIMARY KEY (`id`, `part`), " +
        "KEY `snapshot_id` (`snapshot_id`), " +
        "KEY `dn` (`dn`), " +
        "KEY `kind` (`kind`), " +
        "KEY `config_kind` (`config_kind`), " +
        "KEY `config_hash_part` (`config_hash_part`) " +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1 " +
    "PARTITION BY RANGE (part) ( " +
        "PARTITION p0 VALUES LESS THAN (0) " +
    ");" 

    ,

    "CREATE TABLE IF NOT EXISTS `diffs` ( " +
        "`id` int unsigned NOT NULL AUTO_INCREMENT, " +
        "`part` int unsigned NOT NULL, " +
        "`snapshot_id` int unsigned NOT NULL, " +
        "`date` datetime NOT NULL, " +
        "`in_snapshot` tinyint(1) NOT NULL, " +
        "`summary` json NOT NULL, " +
        "PRIMARY KEY (`id`, `part`), " +
        "KEY `snapshot_id` (`snapshot_id`), " +
        "KEY `date` (`date`) " +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1 " +
    "PARTITION BY RANGE (part) ( " +
        "PARTITION p0 VALUES LESS THAN (0) " +
    ");"

    ,

    "CREATE TABLE IF NOT EXISTS `diff_items` ( " +
        "`id` int unsigned NOT NULL AUTO_INCREMENT, " +
        "`part` int unsigned NOT NULL, " +
        "`diff_id` int unsigned NOT NULL, " +
        "`dn` varchar(1024) NOT NULL DEFAULT '', " +
        "`kind` varchar(128) NOT NULL DEFAULT '', " +
        "`config_kind` varchar(128) NOT NULL DEFAULT '', " +
        "`name` varchar(128) NULL DEFAULT '', " +
        "`present` tinyint(1) NOT NULL, " +
        "`config_hash_part` smallint unsigned NOT NULL, " +
        "`config_hash` binary(32) NULL, " +
        "PRIMARY KEY (`id`, `part`), " +
        "KEY `diff_id` (`diff_id`), " +
        "KEY `dn` (`dn`), " +
        "KEY `kind` (`kind`), " +
        "KEY `config_kind` (`config_kind`), " +
        "KEY `config_hash_part` (`config_hash_part`) " +
    ") ENGINE=InnoDB DEFAULT CHARSET=latin1 " +
    "PARTITION BY RANGE (part) ( " +
        "PARTITION p0 VALUES LESS THAN (0) " +
    ")"

    ];

    return Promise.serial(queryies, x => executeSql(x));
}