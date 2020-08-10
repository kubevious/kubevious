const _ = require('the-lodash');
const moment = require('moment')
const Promise = require('the-promise')

class HistoryCleanupProcessor {
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('HistoryCleanupProcessor');
        this._database = context.database;
        this._configHashesDict = {}
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
        this._registerStatement('FIND_CONFIG_HASHES', 'SELECT `key` FROM `config_hashes`')

        this._registerStatement('FIND_OLDEST_SNAPSHOTS', 'SELECT `id` FROM `snapshots` WHERE `date` < ? ORDER BY `date`')

        this._registerStatement('FIND_DIFFS_FOR_SNAPSHOT', 'SELECT `id` FROM `diffs` WHERE `snapshot_id` = ?')

        this._registerStatement('FIND_DIFF_ITEMS_CONFIG_HASHES', 'SELECT `config_hash` FROM `diff_items` WHERE `diff_id` = ?')

        this._registerStatement('DELETE_DIFF_ITEMS_FOR_DIFF', 'DELETE FROM `diff_items` WHERE `diff_id` = ?')

        this._registerStatement('DELETE_DIFFS_FOR_SNAPSHOT', 'DELETE FROM `diffs` WHERE `snapshot_id` = ?')

        this._registerStatement('FIND_SNAP_ITEMS_CONFIG_HASHES', 'SELECT `config_hash` FROM `snap_items` WHERE `snapshot_id` = ?')

        this._registerStatement('DELETE_SNAP_ITEMS_BY_SNAPSHOT_ID', 'DELETE FROM `snap_items` WHERE `snapshot_id` = ?')

        this._registerStatement('DELETE_SNAPSHOT_BY_ID', 'DELETE FROM `snapshots` WHERE `id` = ?')

        this._registerStatement('DELETE_CONFIG_HASHES', 'DELETE FROM `config_hashes` WHERE `key` = ?')

        this._registerStatement('OPTIMIZE_DIFF_ITEMS', 'OPTIMIZE TABLE `diff_items`')

        this._registerStatement('OPTIMIZE_SNAP_ITEMS', 'OPTIMIZE TABLE `snap_items`')
    }

    _retryToDelete()
    {
        return this._queryConfigHashes()
            .then(() => {
                const snapDate = [moment().subtract(this._days, 'days').format()];

                return this.fetchAllSnapshots(snapDate)
                    .then(snapshots => {
                        return Promise.serial(snapshots, snapshot => this.cleanDb(snapshot))
                    }).catch(() => {
                        this._logger.error('No more snapshots')
                    })
            })
    }

    _queryConfigHashes()
    {
        return this._execute('FIND_CONFIG_HASHES')
            .then(hashes => {
                return this._configHashesDict = _.makeDict(hashes, x => x.key)
            })
    }

    cleanDb(snapshot)
    {
        return this.deleteDiffs(snapshot.id)
            .then(() => this.deleteSnapshot(snapshot.id))
            .then(() => this.deleteConfigHashes())
            .then(() => this.optimizeTables())
    }

    fetchAllSnapshots(date)
    {
        return this._execute('FIND_OLDEST_SNAPSHOTS', date)
    }

    deleteDiffs(snapshotId)
    {
        return this._execute('FIND_DIFFS_FOR_SNAPSHOT', [snapshotId])
            .then(diffs => {
                return Promise.serial(diffs, diff => this.deleteDiffItems(diff.id))
                    .then(() => this._execute('DELETE_DIFFS_FOR_SNAPSHOT', [snapshotId]))
            })
            .then(() => this.deleteSnapshotItem(snapshotId))
    }

    deleteDiffItems(diffId)
    {
        return this._execute('FIND_DIFF_ITEMS_CONFIG_HASHES', [diffId])
            .then(hashes => {
                this._cleanConfigHashes(hashes)

                return this._execute('DELETE_DIFF_ITEMS_FOR_DIFF', [diffId])
                    .then(res => res)
            })
    }

    deleteSnapshotItem(snapshotId)
    {
        return this._execute('FIND_SNAP_ITEMS_CONFIG_HASHES', [snapshotId])
            .then(hashes => {
                this._cleanConfigHashes(hashes)
            })
            .then(() => {
                return this._execute('DELETE_SNAP_ITEMS_BY_SNAPSHOT_ID', [snapshotId])
                    .then(res => res)
            })

    }

    deleteSnapshot(snapshotId)
    {
        return this._execute('DELETE_SNAPSHOT_BY_ID', [snapshotId])
            .then(res => res)
    }

    deleteConfigHashes()
    {
        const hashes = Object.keys(this._configHashesDict)
        return Promise.serial(hashes, hash =>
            this._execute('DELETE_CONFIG_HASHES', [hash.key]))
    }

    optimizeTables()
    {
        return this._execute('OPTIMIZE_DIFF_ITEMS')
            .then(logs => Promise.resolve(this._showOptimizeLogs(logs)))
            .then(() => this._execute('OPTIMIZE_SNAP_ITEMS'))
            .then(logs => Promise.resolve(this._showOptimizeLogs(logs)))
    }

    _showOptimizeLogs(logs)
    {
        logs.forEach(log => {
            this._logger.info(`[${log.Table}] ${log.Msg_type}: ${log.Msg_text}`)
        })
    }

    _cleanConfigHashes(hashes)
    {
        hashes.forEach(hash => {
            delete this._configHashesDict[hash.config_hash]
        })
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
