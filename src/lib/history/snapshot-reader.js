const Promise = require('the-promise');
const _ = require('the-lodash');
const Snapshot = require("kubevious-helpers").History.Snapshot;
const SnapshotReconstructor = require("kubevious-helpers").History.SnapshotReconstructor;

class HistorySnapshotReader
{
    constructor(logger, driver)
    {
        this._logger = logger.sublogger('HistorySnapshotReader');
        this._driver = driver;

        this._registerStatements();
    }

    get logger() {
        return this._logger;
    }

    _registerStatements()
    {
        this._registerStatement('GET_SNAPSHOT_BY_ID', 'SELECT * FROM `snapshots` WHERE `id` = ?;');
        this._registerStatement('GET_RECENT_SNAPSHOT', 'SELECT * FROM `snapshots` ORDER BY `date` DESC LIMIT 1;');
        
        this._registerStatement('GET_DIFFS_FOR_SNAPSHOT', 'SELECT * FROM `diffs` WHERE `in_snapshot` = 0 AND `snapshot_id` = ? ORDER BY `date`;');
        this._registerStatement('GET_DIFFS_FOR_SNAPSHOT_AND_DATE', 'SELECT * FROM `diffs` WHERE `in_snapshot` = 0 AND `snapshot_id` = ? AND `date` <= ? ORDER BY `date`;');

        this._registerStatement('GET_SNAPSHOT_ITEMS', 'SELECT `id`, `dn`, `kind`, `config_kind`, `name`, `config_hash` FROM `snap_items` WHERE `snapshot_id` = ?');
        this._registerStatement('GET_SNAPSHOT_ITEMS_WITH_CONFIG', 'SELECT `id`, `dn`, `kind`, `config_kind`, `name`, `config_hash`, `value` as `config` FROM `snap_items` INNER JOIN `config_hashes` ON `snap_items`.`config_hash` = `config_hashes`.`key` WHERE `snapshot_id` = ?');

        this._registerStatement('GET_DIFF_ITEMS', 'SELECT `id`, `dn`, `kind`, `config_kind`, `name`, `present`, `config_hash` FROM `diff_items` WHERE `diff_id` = ?');
        this._registerStatement('GET_DIFF_ITEMS_WITH_CONFIG', 'SELECT `id`, `dn`, `kind`, `config_kind`, `name`, `present`, `config_hash`, `value` as `config` FROM `diff_items` INNER JOIN `config_hashes` ON `diff_items`.`config_hash` = `config_hashes`.`key` WHERE `diff_id` = ?');
    }

    _registerStatement()
    {
        return this._driver.registerStatement.apply(this._driver, arguments);
    }

    queryDiffsForSnapshot(snapshotId)
    {
        return this._execute('GET_DIFFS_FOR_SNAPSHOT', [snapshotId]);
    }

    queryDiffsForSnapshotAndDate(snapshotId, date)
    {
        return this._execute('GET_DIFFS_FOR_SNAPSHOT_AND_DATE', [snapshotId, date]);
    }

    querySnapshotItems(snapshotId, includeConfig)
    {
        if (includeConfig)
        {
            return this._execute('GET_SNAPSHOT_ITEMS_WITH_CONFIG', [snapshotId]);
        }
        else
        {
            return this._execute('GET_SNAPSHOT_ITEMS', [snapshotId]);
        }
    }

    queryRecentSnapshot()
    {
        return this._execute('GET_RECENT_SNAPSHOT')
            .then(results => {
                return _.head(results);
            });
    }

    queryDiffItems(diffId, includeConfig)
    {
        if (includeConfig)
        {
            return this._execute('GET_DIFF_ITEMS_WITH_CONFIG', [diffId]);
        }
        else
        {
            return this._execute('GET_DIFF_ITEMS', [diffId]);
        }
    }

    reconstructSnapshotById(snapshotId, includeConfig)
    {
        var snapshotReconstructor = null;
        return Promise.resolve()
            .then(() => this.querySnapshotItems(snapshotId, includeConfig))
            .then(snapshotItems => {
                snapshotReconstructor = new SnapshotReconstructor(snapshotItems);
                return this.queryDiffsForSnapshot(snapshotId)
            })
            .then(diffs => {
                return this._queryDiffsItems(diffs, includeConfig)
            })
            .then(diffsItems => {
                snapshotReconstructor.applyDiffsItems(diffsItems);
                return snapshotReconstructor.getSnapshot();
            })
            ;
    }

    reconstructRecentShaphot(includeConfig)
    {
        return this.queryRecentSnapshot()
            .then(snapshot => {
                this.logger.info('[reconstructRecentShaphot] db snapshot: ', snapshot);
                if (!snapshot) {
                    return new Snapshot();
                }
                return this.reconstructSnapshotById(snapshot.id, includeConfig);
            })
    }

    _queryDiffsItems(diffs, includeConfig)
    {
        return Promise.serial(diffs, diff => {
            return this.queryDiffItems(diff.id, includeConfig);
        });
    }

    /**  **/

    _execute(statementId, params)
    {
        return this._driver.executeStatement(statementId, params);
    }

}



module.exports = HistorySnapshotReader;