const _ = require('the-lodash');
const moment = require('moment')
const Promise = require('the-promise')
const CronJob = require('cron').CronJob

const MY_TABLES_TO_PROCESS = ['snapshots', 'diffs', 'snap_items', 'diff_items', 'config_hashes'];

class HistoryCleanupProcessor {
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('HistoryCleanupProcessor');
        this._database = context.database;
        this._days = 5
        this._processing = false;

        context.database.onConnect(this._onDbConnected.bind(this));
    }

    get logger() {
        return this._logger;
    }

    init()
    {
        this._setupCronJob();
    }

    _setupCronJob()
    {
        // Run db cleanup every ***
        // const cleanupJob = new CronJob('*/1 * * * *', () => {
        //     console.log('CleanupJob has started')
        //     this._historyCleanupProcessor.cleanDb()
        // })

        // Run table optimization every Sunday at 01:00 AM
        // const tableOptimizeJob = new CronJob('0 1 * * SUN', () => {
        //     console.log('TableOptimizeJob has started')
        // })

        // cleanupJob.start()
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

        this._registerStatement('FIND_OLDEST_SNAPSHOTS', 'SELECT `id` FROM `snapshots` WHERE `date` < ? ORDER BY `date` LIMIT 100')

        this._registerStatement('FIND_DIFFS_FOR_SNAPSHOT', 'SELECT `id` FROM `diffs` WHERE `snapshot_id` = ?')

        this._registerStatement('FIND_DIFF_ITEMS_CONFIG_HASHES', 'SELECT `config_hash` FROM `diff_items`')

        this._registerStatement('DELETE_DIFF_ITEMS_FOR_DIFF', 'DELETE FROM `diff_items` WHERE `diff_id` = ?')

        this._registerStatement('DELETE_DIFFS_FOR_SNAPSHOT', 'DELETE FROM `diffs` WHERE `snapshot_id` = ?')

        this._registerStatement('FIND_SNAP_ITEMS_CONFIG_HASHES', 'SELECT `config_hash` FROM `snap_items`')

        this._registerStatement('DELETE_SNAP_ITEMS_BY_SNAPSHOT_ID', 'DELETE FROM `snap_items` WHERE `snapshot_id` = ?')

        this._registerStatement('DELETE_SNAPSHOT_BY_ID', 'DELETE FROM `snapshots` WHERE `id` = ?')

        this._registerStatement('DELETE_CONFIG_HASH', 'DELETE FROM `config_hashes` WHERE `key` = ?')
    }

    processCleanup()
    {
        this._logger.info('[processCleanup] Begin');
        if (this._processing) {
            this._logger.warn('[processCleanup] Skipped');
            return;
        }
        this._processing = true;

        this._currentConfigHashes = [];
        this._usedHashesDict = {};

        this._cutoffDate = [moment().subtract(this._days, 'days').format()];
        this._logger.info('[_cleanupSnapshots] Cutoff Date=%s', this._cutoffDate);

        return this._process(this._context.tracker)
            .then(() => {
                this._processing = false;
                this._logger.info('[processCleanup] End');
            })
            .catch(reason => {
                this._processing = false;
                this._logger.error('[processCleanup] FAILED: ', reason);
            })
    }

    _process(tracker)
    {
        return tracker.scope("HistoryCleanupProcessor::_process", (childTracker) => {
            return Promise.resolve()
                .then(() => this._countDB('pre-cleanup'))
                .then(() => this._cleanupSnapshots(childTracker))
                .then(() => this._cleanupHashes(childTracker))
                .then(() => this._countDB('post-cleanup'))
                .then(() => this._optimizeTables(childTracker))
                .then(() => this._countDB('finish'))
        });
    }

    _cleanupSnapshots(tracker)
    {
        this._logger.info('[_cleanupSnapshots] Running...');

        return tracker.scope("_cleanupSnapshots", (childTracker) => {
            return this._cleanupSomeSnapshots()
                .then(hasSnapshotsToDelete => {
                    if (hasSnapshotsToDelete) {
                        return this._cleanupSnapshots(tracker);
                    }
                })
        });
    }

    _cleanupSomeSnapshots()
    {
        var hasSnapshots = false;
        return this._fetchSnapshots(this._cutoffDate)
            .then(snapshots => {
                this._logger.info('[_cleanupSomeSnapshots] Snapshot count: %s', snapshots.length);
                hasSnapshots = (snapshots.length > 0);
                if (hasSnapshots) {
                    this._logger.info('[_cleanupSomeSnapshots] Top Snapshot ID: %s', snapshots[0].id);
                }
                return Promise.serial(snapshots, snapshot => this._cleanupSnapshot(snapshot))
            })
            .then(() => {
                return hasSnapshots;  
            })
    }

    _cleanupSnapshot(snapshot)
    {
        return this._cleanupDiffs(snapshot.id)
            .then(() => this._execute('DELETE_SNAP_ITEMS_BY_SNAPSHOT_ID', [snapshot.id]))
            .then(() => this._execute('DELETE_SNAPSHOT_BY_ID', [snapshot.id]))
    }

    _cleanupDiffs(snapshotId)
    {
        return Promise.resolve()
            .then(() => this._execute('FIND_DIFFS_FOR_SNAPSHOT', [snapshotId]))
            .then(diffs => {
                return Promise.serial(diffs, diff => this._deleteDiffItems(diff.id))
            })
            .then(() => this._execute('DELETE_DIFFS_FOR_SNAPSHOT', [snapshotId]))
    }

    _cleanupHashes(tracker)
    {
        this._logger.info('[_cleanupHashes] Begin');

        return tracker.scope("_cleanupHashes", (childTracker) => {
            return Promise.resolve()
                .then(() => this._queryConfigHashes(childTracker))
                .then(() => this._queryUsedHashes(childTracker))
                .then(() => this._cleanupConfigHashes(childTracker))
        });
    }

    _queryConfigHashes()
    {
        return this._execute('FIND_CONFIG_HASHES')
            .then(hashes => {
                this._currentConfigHashes = hashes;
            })
    }

    _queryUsedHashes()
    {
        this._usedHashesDict = {};
        return this._execute('FIND_SNAP_ITEMS_CONFIG_HASHES')
            .then(hashes => {
                for(var hash of hashes)
                {
                    this._usedHashesDict[hash.config_hash] = true;
                }
            })
            .then(() => this._execute('FIND_DIFF_ITEMS_CONFIG_HASHES'))
            .then(hashes => {
                for(var hash of hashes)
                {
                    this._usedHashesDict[hash.config_hash] = true;
                }
            })
    }

    _cleanupConfigHashes(tracker)
    {
        this.logger.info('[_cleanupConfigHashes] used hash count: %s', _.keys(this._usedHashesDict).length);
        this.logger.info('[_cleanupConfigHashes] current hash count: %s', this._currentConfigHashes.length);

        var hashesToDelete = this._currentConfigHashes.filter(x => !this._usedHashesDict[x.key]);
        this.logger.info('[_cleanupConfigHashes] hashes to delete: %s', hashesToDelete.length);

        return tracker.scope("delete", () => {
            return Promise.serial(hashesToDelete, x => {
                return this._execute('DELETE_CONFIG_HASH', [x.key]);
            })
        });
    }

    _fetchSnapshots(date)
    {
        return this._execute('FIND_OLDEST_SNAPSHOTS', date)
    }

    _deleteDiffItems(diffId)
    {
        return this._execute('DELETE_DIFF_ITEMS_FOR_DIFF', [diffId]);
    }

    _optimizeTables(tracker)
    {
        this._logger.info('[_optimizeTables] Begin');
        return tracker.scope("optimize", (childTracker) => {
            return Promise.serial(MY_TABLES_TO_PROCESS, x => this._optimizeTable(x, childTracker));
        });
    }

    _optimizeTable(tableName, tracker)
    {
        this._logger.info('[_optimizeTable] Optimize Begin, Table: %s', tableName);

        return tracker.scope(tableName, (childTracker) => {
            return Promise.resolve()
                .then(() => this._executeSql(`OPTIMIZE TABLE ${tableName}`))
                .then(logs => {
                    logs.forEach(log => {
                        this._logger.info('[_optimizeTable] Table: %s, %s :: %s', log.Table, log.Msg_type, log.Msg_text)
                    })
                })
                .then(() => {
                    this._logger.info('[_optimizeTable] Optimize End, Table: %s', tableName);
                })
        });
    }

    _countDB(stage)
    {
        return Promise.serial(MY_TABLES_TO_PROCESS, x => this._countTable(x, stage));
    }

    _countTable(tableName, stage)
    {
        if (!stage) {
            stage = '';
        }
        return this._executeSql(`SELECT COUNT(*) as count FROM ${tableName}`)
            .then(result => {
                var count = result[0].count;
                this._logger.info('[_countTable] %s, Table: %s, Row Count: %s ', stage, tableName, count);
                return count;
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

    _executeSql(sql)
    {
        return this._database.executeSql(sql);
    }
}

module.exports = HistoryCleanupProcessor
