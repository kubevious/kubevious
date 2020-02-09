const Promise = require('the-promise');
const _ = require('the-lodash');
const SnapshotReconstructor = require('./snapshot-reconstructor');

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
        
        this._registerStatement('GET_DIFFS_FOR_SNAPSHOT', 'SELECT * FROM `diffs` WHERE `snapshot_id` = ? ORDER BY `date`;');
        this._registerStatement('GET_DIFFS_FOR_SNAPSHOT_AND_DATE', 'SELECT * FROM `diffs` WHERE `snapshot_id` = ? AND `date` <= ? ORDER BY `date`;');

        this._registerStatement('GET_SNAPSHOT_ITEMS', 'SELECT `id`, `dn`, `info`, `config` FROM `snap_items` WHERE `snapshot_id` = ?');

        this._registerStatement('GET_DIFF_ITEMS', 'SELECT `id`, `dn`, `info`, `present`, `config` FROM `diff_items` WHERE `diff_id` = ?');
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

    querySnapshotItems(snapshotId)
    {
        return this._execute('GET_SNAPSHOT_ITEMS', [snapshotId]);
    }

    queryRecentSnapshot()
    {
        return this._execute('GET_RECENT_SNAPSHOT');
    }

    queryDiffItems(diffId)
    {
        return this._execute('GET_DIFF_ITEMS', [diffId]);
    }

    querySnapshotById(snapshotId)
    {
        var snapshotReconstructor = null;
        return Promise.resolve()
            .then(() => this.querySnapshotItems(snapshotId))
            .then(snapshotItems => {
                snapshotReconstructor = new SnapshotReconstructor(snapshotItems);
                return this.queryDiffsForSnapshot(snapshotId)
            })
            .then(diffs => {
                return this._queryDiffsItems(diffs)
            })
            .then(diffsItems => {
                snapshotReconstructor.applyDiffsItems(diffsItems);
                return snapshotReconstructor.getSnapshotList();
            })
            ;
    }

    _queryDiffsItems(diffs)
    {
        return Promise.serial(diffs, diff => {
            return this.queryDiffItems(diff.id);
        });
    }

    /**  **/

    _execute(statementId, params)
    {
        return this._driver.executeStatement(statementId, params);
    }

}



module.exports = HistorySnapshotReader;