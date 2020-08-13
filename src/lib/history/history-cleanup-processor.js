const _ = require('the-lodash');
const moment = require('moment')
const Promise = require('the-promise');
const { partition } = require('the-lodash');
const CronJob = require('cron').CronJob
const HistoryPartitioning = require("kubevious-helpers").History.Partitioning;

const MY_TABLES_TO_PROCESS = [
    {
        name: 'snapshots',
        id: 'id',
        isSnapshot: true
    },
    {
        name: 'diffs',
        id: 'id',
        isSnapshot: true
    },
    {
        name: 'diff_items',
        id: 'id',
        isSnapshot: true
    },
    {
        name: 'snap_items',
        id: 'id',
        isSnapshot: true
    },
    {
        name: 'config_hashes',
        id: 'key',
        isSnapshot: false
    }
];

class HistoryCleanupProcessor {
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('HistoryCleanupProcessor');
        this._database = context.database;
        this._days = -15;
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
        return;
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
        this._registerStatement('FIND_SNAP_ITEMS_CONFIG_HASHES', 'SELECT DISTINCT `config_hash` FROM `snap_items` WHERE `config_hash_part` = ?')

        this._registerStatement('FIND_DIFF_ITEMS_CONFIG_HASHES', 'SELECT DISTINCT `config_hash` FROM `diff_items` WHERE `config_hash_part` = ?')

        this._registerStatement('DELETE_CONFIG_HASH', 'DELETE FROM `config_hashes` WHERE `key` = ? AND `part` = ?')
    }

    _setupCronJob()
    {
        // TODO: Temporarity disabled cleanup scheduling.
        return;
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

        this._cutoffDate = moment().subtract(this._days, 'days');
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
                    this._context.historyProcessor.setUsedHashesDict({});
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

        var tables = MY_TABLES_TO_PROCESS.filter(x => x.isSnapshot);

        return tracker.scope("_cleanupSnapshots", (childTracker) => {
            return Promise.serial(tables, x => this._cleanupSnapshotTables(x.name));
        });
    }

    _cleanupSnapshotTables(tableName)
    {
        this._logger.info('[_cleanupSnapshotTables] Table: %s', tableName);
        return this._database.queryPartitions(tableName)
            .then(partitions => {
                this._logger.info('[_cleanupSnapshotTables] Table: %s, Current Partitions: ', tableName, partitions);

                var cutoffPartition = HistoryPartitioning.calculateDatePartition(this._cutoffDate);
                this._logger.info('[_cleanupSnapshotTables] CutoffPartition=%s', cutoffPartition);

                for(var x of partitions)
                {
                    x.id = (x.value - 1);
                }

                var partitionsToDelete = partitions.filter(x => (x.id <= cutoffPartition));
                this._logger.info('[_cleanupSnapshotTables] partitionsToDelete:', partitionsToDelete);

                return Promise.serial(partitionsToDelete, x => this._deletePartition(tableName, x));
            });
    }

    _deletePartition(tableName, partitionInfo)
    {
        this._logger.info('[_deletePartition] Table: %s, Partition: %s, Id: %s', tableName, partitionInfo.name, partitionInfo.id);
        this._context.historyProcessor.markDeletedPartition(partitionInfo.id);
        return this._database.dropPartition(tableName, partitionInfo.name);
    }

    _cleanupHashes(tracker)
    {
        this._logger.info('[_cleanupHashes] Begin');

        return tracker.scope("_cleanupHashes", (childTracker) => {

            var ids = _.range(1, HistoryPartitioning.CONFIG_HASH_PARTITION_COUNT + 1);
            return Promise.serial(ids, x => this._cleanupHashPartition(x, childTracker));

        });
    }

    _cleanupHashPartition(partition, tracker)
    {
        this._logger.info('[_cleanupHashPartition] Partition: %s', partition);

        var hashes = null;
        var usedHashesDict = null;
        return Promise.resolve()
            .then(() => this._queryConfigHashes(partition, tracker))
            .then(result => {
                hashes = result;
            })
            .then(() => this._queryUsedHashes(partition, tracker))
            .then(result => {
                usedHashesDict = result;
            })
            .then(() => this._cleanupConfigHashes(partition, hashes, usedHashesDict, tracker))
    }

    _queryConfigHashes(partition, tracker)
    {
        return tracker.scope("_queryConfigHashes", (childTracker) => {
            var sql = `SELECT \`key\` FROM \`config_hashes\` PARTITION (${this._partitionName(partition)})`;
            return this._executeSql(sql)
                .then(hashes => {
                    this.logger.info("[_queryConfigHashes] Partition: %s, Count: %s", partition, hashes.length);
                    return hashes;
                })
        });
    }

    _queryUsedHashes(partition, tracker)
    {
        return tracker.scope("_queryUsedHashes", (childTracker) => {
            var usedHashesDict = {};
            return this._execute('FIND_SNAP_ITEMS_CONFIG_HASHES', [partition])
                .then(hashes => {
                    for(var hash of hashes)
                    {
                        usedHashesDict[hash.config_hash] = true;
                    }
                })
                .then(() => this._execute('FIND_DIFF_ITEMS_CONFIG_HASHES', [partition]))
                .then(hashes => {
                    for(var hash of hashes)
                    {
                        usedHashesDict[hash.config_hash] = true;
                    }
                })
                .then(() => {
                    this.logger.info("[_queryUsedHashes] Partition: %s, Count: %s", partition, _.keys(usedHashesDict).length);
                    return usedHashesDict;
                })
        });
    }

    _partitionName(partition)
    {
        return 'p' + partition;
    }

    _cleanupConfigHashes(partition, hashes, usedHashesDict, tracker)
    {
        this.logger.info('[_cleanupConfigHashes] partition: %s, usedCount: %s, currentCount: %s', partition, _.keys(usedHashesDict).length, hashes.length);

        var hashesToDelete = hashes.filter(x => !usedHashesDict[x.key]);
        this.logger.info('[_cleanupConfigHashes] partition: %s, hashes to delete: %s', partition, hashesToDelete.length);

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
                            return this._execute('DELETE_CONFIG_HASH', [x.key, partition]);
                        })
                    })
                })

            });
        });
    }

    _optimizeTables(tracker)
    {
        this._logger.info('[_optimizeTables] Begin');
        return tracker.scope("optimize", (childTracker) => {
            return this._optimizeTable('config_hashes');
        });
    }

    _optimizeTable(tableName)
    {
        this._logger.info('[_optimizeTable] Optimize Begin, Table: %s', tableName);

        // TODO: Optimize in transaction one table at a time.
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
    }

    _outputDBUsage(stage, tracker)
    {
        return tracker.scope("_outputDBUsage", (childTracker) => {
            return this._outputDbSize(stage)
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
        var sql = `SELECT \`TABLE_NAME\`, \`TABLE_ROWS\`, ((data_length + index_length) / 1024 / 1024 ) AS size FROM information_schema.TABLES WHERE table_schema = "${process.env.MYSQL_DB}"`
        return this._executeSql(sql)
            .then(result => {
                result = _.orderBy(result, ['size'], ['desc']);
                for(var x of result)
                {
                    this._logger.info('[_outputDbSize] %s, Table: %s, Rows: %s, Size: %s MB', stage, x.TABLE_NAME, x.TABLE_ROWS, x.size);
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
