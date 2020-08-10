const _ = require('the-lodash');
const moment = require('moment')
const Promise = require('the-promise')

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
        this._registerStatement('FIND_OLDEST_SNAPSHOTS', 'SELECT `id` FROM `snapshots` WHERE `date` < ? ORDER BY `date`')

        this._registerStatement('FIND_DIFFS_FOR_SNAPSHOT', 'SELECT `id` FROM `diffs` WHERE `snapshot_id` = ?')

        this._registerStatement('DELETE_DIFF_ITEMS_FOR_DIFF', 'DELETE FROM `diff_items` WHERE `diff_id` = ?')

        this._registerStatement('DELETE_DIFFS_FOR_SNAPSHOT', 'DELETE FROM `diffs` WHERE `snapshot_id` = ?')

        this._registerStatement('DELETE_SNAP_ITEMS_BY_SNAPSHOT_ID', 'DELETE FROM `snap_items` WHERE `snapshot_id` = ?')

        this._registerStatement('DELETE_SNAPSHOT_BY_ID', 'DELETE FROM `snapshots` WHERE `id` = ?')
    }

    _retryToDelete()
    {
        const snapDate = [moment().subtract(this._days, 'days').format()];

        return this.fetchAllSnapshots(snapDate)
            .then(snapshots => {
                return Promise.serial(snapshots, snapshot => this.cleanDb(snapshot))
            }).catch(() => {
                this._logger.error('No more snapshots')
            })
    }

    cleanDb(snapshot)
    {
        return this.deleteDiffs(snapshot.id)
            .then(() => this.deleteSnapshot(snapshot.id))
    }

    fetchAllSnapshots(date)
    {
        return this._execute('FIND_OLDEST_SNAPSHOTS', date)
    }

    deleteDiffs(snapshotId)
    {
        return this._execute('FIND_DIFFS_FOR_SNAPSHOT', [snapshotId])
            .then(diffs => {
                return Promise.serial(diffs, diff => {
                    return this.deleteDiffItems(diff.id)
                        .then(() => this._execute('DELETE_DIFFS_FOR_SNAPSHOT', [snapshotId]))
                })
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

    deleteSnapshotItem(snapshotId)
    {
        return this._execute('DELETE_SNAP_ITEMS_BY_SNAPSHOT_ID', [snapshotId])
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
