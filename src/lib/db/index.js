const Promise = require('the-promise');
const _ = require('the-lodash');
const MySqlDriver = require("kubevious-helpers").MySqlDriver;

const TARGET_DB_VERSION = 3;

class Database
{
    constructor(logger)
    {
        this._logger = logger.sublogger("DB");
        this._driver = new MySqlDriver(logger);

        this._driver.onMigrate(this._onDbMigrate.bind(this));
    }

    get logger() {
        return this._logger;
    }

    get driver() {
        return this._driver;
    }

    get isConnected() {
        return this._driver.isConnected;
    }

    onConnect(cb)
    {
        return this._driver.onConnect(cb);
    }

    registerStatement(id, sql)
    {
        return this._driver.registerStatement(id, sql);
    }

    init()
    {
        this._logger.info("[init]")
        return Promise.resolve()
            .then(() => this._driver.connect())
            .then(() => {
                this._logger.info("[init] post connect.")
            })
    }

    _onDbMigrate()
    {
        this._logger.info("[_onDbMigrate] ...");
        this._latestSnapshot = null;
        return Promise.resolve()
            .then(() => this._processMigration())
            ;
    }

    _processMigration()
    {
        this.logger.info("[_processMigration] ...");

        return this.driver.executeInTransaction(() => {
            return Promise.resolve()
                .then(() => this._getDbVersion())
                .then(version => {
                    this.logger.info("[_processMigration] VERSION: %s", version);
                    var migrateableVersions = _.range(version + 1, TARGET_DB_VERSION + 1);
                    this.logger.info("[_processMigration] MigrateableVersions: ", migrateableVersions);
                    return Promise.serial(migrateableVersions, x => this._processVersionMigration(x));
                })
        });
    }

    _processVersionMigration(targetVersion)
    {
        this.logger.info("[_processVersionMigration] target version: %s", targetVersion);

        var migrator = require('./migrators/' + targetVersion);
        return Promise.resolve()
            .then(() => migrator(this.logger, this.driver))
            .then(() => {
                return this._setDbVersion(targetVersion);
            })
    }

    _getDbVersion()
    {
        return this.driver.executeSql('SELECT `value` FROM `config` WHERE `key` = "DB_SCHEMA"')
            .then(result => {
                var value = _.head(result);
                if (value) {
                    return value.value.version || 0;
                }
                return 0;
            })
            ;
    }

    _setDbVersion(version)
    {
        this._logger.info("[_setDbVersion] version: %s", version);

        var valueObj = {
            version: version
        };

        return this.driver.executeSql('INSERT INTO `config` (`key`, `value`) VALUES ("DB_SCHEMA", ?) ON DUPLICATE KEY UPDATE `value` = ?',
            [valueObj, valueObj])
            ;
    }
}

module.exports = Database;