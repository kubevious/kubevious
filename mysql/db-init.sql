USE kubevious;
SET NAMES utf8mb4;

SET GLOBAL expire_logs_days = 0;
SET GLOBAL binlog_expire_logs_seconds = 259200;

CREATE TABLE IF NOT EXISTS `config` (
  `key` varchar(64) NOT NULL DEFAULT '',
  `value` json NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `config_hashes` (
  `key` BINARY(32) NOT NULL DEFAULT '',
  `value` json NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `snapshots` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `snap_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `snapshot_id` int unsigned NOT NULL,
  `dn` varchar(1024) NOT NULL DEFAULT '',
  `kind` varchar(128) NOT NULL DEFAULT '',
  `config_kind` varchar(128) NOT NULL DEFAULT '',
  `name` varchar(128) NULL DEFAULT '',
  `config_hash` BINARY(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `snapshot_id` (`snapshot_id`),
  KEY `dn` (`dn`),
  KEY `kind` (`kind`),
  KEY `config_kind` (`config_kind`),
  CONSTRAINT `snap_item_snapshot_id` FOREIGN KEY (`snapshot_id`) REFERENCES `snapshots` (`id`),
  CONSTRAINT `snap_item_config_hash` FOREIGN KEY (`config_hash`) REFERENCES `config_hashes` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `diffs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `snapshot_id` int unsigned NOT NULL,
  `date` datetime NOT NULL,
  `in_snapshot` tinyint(1) NOT NULL,
  `summary` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `snapshot_id` (`snapshot_id`),
  KEY `date` (`date`),
  CONSTRAINT `diff_snapshot_id` FOREIGN KEY (`snapshot_id`) REFERENCES `snapshots` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `diff_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `diff_id` int unsigned NOT NULL,
  `dn` varchar(1024) NOT NULL DEFAULT '',
  `kind` varchar(128) NOT NULL DEFAULT '',
  `config_kind` varchar(128) NOT NULL DEFAULT '',
  `name` varchar(128) NULL DEFAULT '',
  `present` tinyint(1) NOT NULL,
  `config_hash` BINARY(32) NULL,
  PRIMARY KEY (`id`),
  KEY `diff_id` (`diff_id`),
  KEY `dn` (`dn`),
  KEY `kind` (`kind`),
  KEY `config_kind` (`config_kind`),
  CONSTRAINT `diff_item_diff_id` FOREIGN KEY (`diff_id`) REFERENCES `diffs` (`id`),
  CONSTRAINT `diff_item_config_hash` FOREIGN KEY (`config_hash`) REFERENCES `config_hashes` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE IF NOT EXISTS `rules` (
  `name` varchar(128) NOT NULL,
  `enabled` TINYINT NOT NULL,
  `date` DATETIME NOT NULL,
  `target` TEXT NOT NULL,
  `script` TEXT NOT NULL,
  `hash` BINARY(32) NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `rule_statuses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(128) NOT NULL,
  `hash` BINARY(32) NOT NULL,
  `date` DATETIME NOT NULL,
  `error_count` int unsigned NOT NULL,
  `item_count` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `rule_name` (`rule_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `rule_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(128) NOT NULL,
  `kind` varchar(128) NOT NULL,
  `msg` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `rule_name` (`rule_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `rule_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(128) NOT NULL,
  `dn` varchar(1024) NOT NULL,
  `errors` int unsigned NOT NULL,
  `warnings` int unsigned NOT NULL,
  `markers` json NULL,
  PRIMARY KEY (`id`),
  KEY `rule_name` (`rule_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE IF NOT EXISTS `markers` (
  `name` varchar(128) NOT NULL, 
  `shape` varchar(128) NOT NULL, 
  `color` varchar(128) NOT NULL, 
  `propagate` TINYINT NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE IF NOT EXISTS `marker_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `marker_name` varchar(128) NOT NULL,
  `dn` varchar(1024) NOT NULL, 
  PRIMARY KEY (`id`), 
  KEY `marker_name` (`marker_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


INSERT IGNORE INTO `config`(`key`, `value`)
VALUES('DB_SCHEMA', '{ "version": 3 }')
