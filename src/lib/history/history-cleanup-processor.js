const _ = require('the-lodash');
const moment = require('moment')

class HistoryCleanupProcessor {
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('HistoryCleanupProcessor');
        this._database = context.database;
        this._days = 14

        context.database.onConnect(this._onDbConnected.bind(this));
    }

    _onDbConnected()
    {
        this._logger.info("[_onDbConnected] ...");
        this._latestSnapshot = null;

        this._registerStatements()
    }

    _registerStatements()
    {
        this._registerStatement('FIND_OLDEST_SNAPSHOT_ID', 'SELECT `id` FROM `snapshots` WHERE `date` < ? ORDER BY `date` LIMIT 1')

        this._registerStatement('FIND_DIFFS_FOR_SNAPSHOT', 'SELECT `id` FROM `diffs` WHERE `snapshot_id` = ?')

        this._registerStatement('DELETE_DIFF_ITEMS_FOR_DIFF', 'DELETE FROM `diff_items` WHERE `diff_id` = ?')

        this._registerStatement('DELETE_DIFFS_FOR_SNAPSHOT', 'DELETE FROM `diffs` WHERE `snapshot_id` = ?')

        this._registerStatement('DELETE_SNAP_ITEMS_BY_SNAPSHOT_ID', 'DELETE FROM `snap_items` WHERE `snapshot_id` = ?')

        this._registerStatement('DELETE_SNAPSHOT_BY_ID', 'DELETE FROM `snapshots` WHERE `id` = ?')
    }

    _retryToDelete()
    {
        return this.cleanDb()
    }

    cleanDb()
    {
        const snapDate = [moment().subtract(this._days, 'days').format()];

        return Promise.resolve()
            .then(() => this.fetchSnapshot(snapDate))
            .then(snapshot => {
                return Promise.resolve(snapshot.map(item => this.fetchDiffs(item.id)))
                    .then(() => {
                        return this.deleteSnapshot(snapshot[0].id)
                    })
            })
    }

    fetchSnapshot(date)
    {
        return this._execute('FIND_OLDEST_SNAPSHOT_ID', date)
    }

    fetchDiffs(snapshotId)
    {
        return this._execute('FIND_DIFFS_FOR_SNAPSHOT', [snapshotId])
            .then(diffs => {
                return Promise.resolve(diffs.map(item => {
                    return this.deleteDiffItems(item.id)
                        .then(() => this._execute('DELETE_DIFFS_FOR_SNAPSHOT', [item.id]))
                }))
            })
            .then(() => {
                return this.deleteSnapshotItem(snapshotId)
            })
    }

    deleteDiffItems(diffId)
    {
        return this._execute('DELETE_DIFF_ITEMS_FOR_DIFF', [diffId])
            .then(res => res)
    }

    deleteSnapshotItem(snapshotIds)
    {
        return this._execute('DELETE_SNAP_ITEMS_BY_SNAPSHOT_ID', [snapshotIds])
            .then(res => res)
    }

    deleteSnapshot(snapshotId)
    {
        return this._execute('DELETE_SNAPSHOT_BY_ID', [snapshotId])
            .then(res => res)
    }

    _registerStatement(name, sql)
    {
        return this._database.registerStatement(name, sql);
    }

    _execute(name, params)
    {
        return this._database.executeStatement(name, params);
    }

}

module.exports = HistoryCleanupProcessor
