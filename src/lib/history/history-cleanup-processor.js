const _ = require('the-lodash');
const moment = require('moment')
const Promise = require('the-promise')
const CronJob = require('cron').CronJob

const MY_TABLES_TO_PROCESS = [
    {
        name: 'snapshots',
        id: 'id',
        shouldCount: true
    },
    {
        name: 'diffs',
        id: 'id',
        shouldCount: true
    },
    {
        name: 'diff_items',
        id: 'id',
        shouldCount: false
    },
    {
        name: 'snap_items',
        id: 'id',
        shouldCount: false
    },
    {
        name: 'config_hashes',
        id: 'key',
        shouldCount: false
    }
];

class HistoryCleanupProcessor {
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('HistoryCleanupProcessor');
        this._database = context.database;
        this._days = 15;
        this._isProcessing = false;

        this._startupDate = null;
        this._lastCleanupDate = null;

        context.database.onConnect(this._onDbConnected.bind(this));
    }

    get logger() {
        return this._logger;
    }

    init()
    {
        this._startupDate = moment();
        this._setupCronJob();
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

    _setupCronJob()
    {
        var schedule = '* 0/15 0-2 * * *';
        // schedule = '*/1 * * * *';
        const cleanupJob = new CronJob(schedule, () => {
            this._processSchedule();
        })
        cleanupJob.start();
    }

    _processSchedule()
    {
        var now = moment();
        this.logger.info('[_processSchedule] now: %s', now);

        if (now.diff(this._startupDate, 'minutes') < 15) {
            this.logger.info('[_processSchedule] skipped, waiting 15 minutes post startup');
            return;
        }
        if (this._lastCleanupDate)
        {
            if (now.diff(this._lastCleanupDate, 'hours') < 20) {
                this.logger.info('[_processSchedule] skipped, processed within last 20 hours');
                return;
            }
        }

        this.logger.info('[_processSchedule] will execute');
        this.processCleanup();
    }

    processCleanup()
    {
        this._logger.info('[processCleanup] Begin');
        if (this._isProcessing) {
            this._logger.warn('[processCleanup] Skipped');
            return;
        }
        this._isProcessing = true;

        this._lastCleanupDate = moment();

        this._currentConfigHashes = [];
        this._usedHashesDict = {};

        this._cutoffDate = [moment().subtract(this._days, 'days').format()];
        this._logger.info('[processCleanup] Cutoff Date=%s', this._cutoffDate);

        return this._process(this._context.tracker)
            .then(() => {
                this._logger.info('[processCleanup] End');
            })
            .catch(reason => {
                this._logger.error('[processCleanup] FAILED: ', reason);
            })
            .finally(() => {
                this._isProcessing = false;
            })
    }

    _process(tracker)
    {
        return new Promise((resolve, reject) => {

            this._context.historyProcessor.lockForCleanup(historyLock => {

                return tracker.scope("HistoryCleanupProcessor::_process", (childTracker) => {
                    return Promise.resolve()
                        .then(() => this._outputDBUsage('pre-cleanup', childTracker))
                        .then(() => this._cleanupSnapshots(childTracker))
                        .then(() => this._cleanupHashes(childTracker))
                        .then(() => this._outputDBUsage('post-cleanup', childTracker))
                        .then(() => this._optimizeTables(childTracker))
                        .then(() => this._outputDBUsage('finish', childTracker))
                        
                })
                .finally(() => {
                    this._context.historyProcessor.setUsedHashesDict(this._usedHashesDict);
                    historyLock.finish();
                })
                .then(() => {
                    resolve();
                })
                .catch(reason => {
                    reject(reason);
                })
                ;

            });

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
                return this._executeInTransaction(() => {
                    return Promise.serial(snapshots, snapshot => this._cleanupSnapshot(snapshot))
                });
            })
            .then(() => {
                return hasSnapshots;  
            })
    }

    _cleanupSnapshot(snapshot)
    {
        this._context.historyProcessor.markDeletedSnapshot(snapshot.id);
        return this._cleanupDiffs(snapshot.id)
            .then(() => this._execute('DELETE_SNAP_ITEMS_BY_SNAPSHOT_ID', [snapshot.id]))
            .then(() => this._execute('DELETE_SNAPSHOT_BY_ID', [snapshot.id]))
    }

    _cleanupDiffs(snapshotId)
    {
        return Promise.resolve()
            .then(() => this._execute('FIND_DIFFS_FOR_SNAPSHOT', [snapshotId]))
            .then(diffs => {
                return Promise.parallel(diffs, diff => this._deleteDiffItems(diff.id))
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

    _queryConfigHashes(tracker)
    {
        return tracker.scope("_queryConfigHashes", (childTracker) => {
            return this._execute('FIND_CONFIG_HASHES')
                .then(hashes => {
                    this._currentConfigHashes = hashes;
                })
        });
    }

    _queryUsedHashes(tracker)
    {
        return tracker.scope("_queryUsedHashes", (childTracker) => {
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
        });
    }

    _cleanupConfigHashes(tracker)
    {
        this.logger.info('[_cleanupConfigHashes] used hash count: %s', _.keys(this._usedHashesDict).length);
        this.logger.info('[_cleanupConfigHashes] current hash count: %s', this._currentConfigHashes.length);

        var hashesToDelete = this._currentConfigHashes.filter(x => !this._usedHashesDict[x.key]);
        this.logger.info('[_cleanupConfigHashes] hashes to delete: %s', hashesToDelete.length);

        var hashTransactionGroups = this._chunkArrayInGroups(hashesToDelete, 10 * 1000);
        var deleteIteration = 0;

        return tracker.scope("delete", () => {

            return Promise.serial(hashTransactionGroups, hashesInTx => {

                return this._executeInTransaction(() => {
                    this.logger.info('[_cleanupConfigHashes] tx iteration: %s...', deleteIteration);
                    deleteIteration++;

                    var hashGroups = this._chunkArrayInGroups(hashesInTx, 100);

                    return Promise.serial(hashGroups, hashGroup => {
                        return Promise.parallel(hashGroup, x => {
                            return this._execute('DELETE_CONFIG_HASH', [x.key]);
                        })
                    })
                })

            });
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
            return Promise.serial(MY_TABLES_TO_PROCESS, x => this._optimizeTable(x.name, childTracker));
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

    _outputDBUsage(stage, tracker)
    {
        var tablesToCount = MY_TABLES_TO_PROCESS.filter(x => x.shouldCount);
        return tracker.scope("_outputDBUsage", (childTracker) => {
            return this._outputDbSize(stage)
                .then(() => Promise.serial(tablesToCount, x => {
                    return this._countTable(x.name, x.id, stage);
                }))
        });
    }

    _countTable(tableName, keyColumn, stage)
    {
        if (!stage) {
            stage = '';
        }
        return this._executeSql(`SELECT COUNT(\`${keyColumn}\`) as count FROM ${tableName}`)
            .then(result => {
                var count = result[0].count;
                this._logger.info('[_countTable] %s, Table: %s, Row Count: %s ', stage, tableName, count);
                return count;
            })
    }

    _outputDbSize(stage)
    {
        var sql = `SELECT TABLE_NAME, ((data_length + index_length) / 1024 / 1024 ) AS size FROM information_schema.TABLES WHERE table_schema = "${process.env.MYSQL_DB}"`
        return this._executeSql(sql)
            .then(result => {
                result = _.orderBy(result, ['size'], ['desc']);
                for(var x of result)
                {
                    this._logger.info('[_outputDbSize] %s, Table: %s, Size: %s MB', stage, x.TABLE_NAME, x.size);
                }
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

    _executeInTransaction(cb)
    {
        return this._database.executeInTransaction(cb);
    }

    _chunkArrayInGroups(arr, size) {
        var myArray = [];
        for(var i = 0; i < arr.length; i += size) {
          myArray.push(arr.slice(i, i+size));
        }
        return myArray;
    }
}

module.exports = HistoryCleanupProcessor
