const Promise = require('the-promise');
const _ = require('the-lodash');
const DateUtils = require("kubevious-helpers").DateUtils;
const Helpers = require("kubevious-helpers").History.Helpers;
const Snapshot = require("kubevious-helpers").History.Snapshot;
const SnapshotReader = require("kubevious-helpers").History.SnapshotReader;

class HistoryDbAccessor
{
    constructor(context, driver)
    {
        this._context = context;
        this._logger = context.logger.sublogger('HistoryDbAccessor');
        this._driver = driver;
        this._snapshotReader = new SnapshotReader(this.logger, driver);

        this._registerStatements();
    }

    get logger() {
        return this._logger;
    }

    get debugObjectLogger() {
        return this._context.debugObjectLogger;
    }

    get snapshotReader() {
        return this._snapshotReader;
    }

    _registerStatements()
    {
        this._registerStatement('GET_SNAPSHOTS', 'SELECT * FROM `snapshots`;');
        this._registerStatement('FIND_SNAPSHOT', 'SELECT * FROM `snapshots` WHERE `date` = ? ORDER BY `id` DESC LIMIT 1;');
        this._registerStatement('INSERT_SNAPSHOT', 'INSERT INTO `snapshots` (`date`) VALUES (?);');

        this._registerStatement('INSERT_SNAPSHOT_ITEM', 'INSERT INTO `snap_items` (`snapshot_id`, `dn`, `kind`, `config_kind`, `name`, `config_hash`) VALUES (?, ?, ?, ?, ?, ?);');
        this._registerStatement('UPDATE_SNAPSHOT_ITEM', 'UPDATE `snap_items` SET `dn` = ?, `kind` = ?, `config_kind` = ?, `name` = ?, `config_hash` = ? WHERE `id` = ?;');
        this._registerStatement('DELETE_SNAPSHOT_ITEM', 'DELETE FROM `snap_items` WHERE `id` = ?;');

        this._registerStatement('FIND_DIFF', 'SELECT * FROM `diffs` WHERE `snapshot_id` = ? AND `date` = ? AND `in_snapshot` = ? ORDER BY `id` DESC LIMIT 1;');
        this._registerStatement('INSERT_DIFF', 'INSERT INTO `diffs` (`snapshot_id`, `date`, `in_snapshot`, `summary`) VALUES (?, ?, ?, ?);');

        this._registerStatement('INSERT_DIFF_ITEM', 'INSERT INTO `diff_items` (`diff_id`, `dn`, `kind`, `config_kind`, `name`, `present`, `config_hash`) VALUES (?, ?, ?, ?, ?, ?, ?);');
        this._registerStatement('UPDATE_DIFF_ITEM', 'UPDATE `diff_items` SET `dn` = ?, `kind` = ?, `config_kind` = ?, `name` = ?, `present` = ?, `config_hash` = ? WHERE `id` = ?;');
        this._registerStatement('DELETE_DIFF_ITEM', 'DELETE FROM `diff_items` WHERE `id` = ?;');

        this._registerStatement('GET_DIFFS', 'SELECT * FROM diffs;');

        this._registerStatement('GET_CONFIG', 'SELECT * FROM `config` WHERE `key` = ?;');
        this._registerStatement('SET_CONFIG', 'INSERT INTO `config`(`key`, `value`) VALUES(?, ?) ON DUPLICATE KEY UPDATE `value` = ?;');

        this._registerStatement('INSERT_CONFIG_HASH', 'INSERT IGNORE INTO `config_hashes`(`key`, `value`) VALUES(?, ?);');
    }

    updateConfig(key, value)
    {
        var params = [key, value, value]; 
        return this._execute('SET_CONFIG', params);
    }

    queryConfig(key)
    {
        var params = [key]; 
        return this._execute('GET_CONFIG', params)
            .then(results => {
                if (results.length == 0) {
                    return {};
                }
                return _.head(results);
            });
    }
   
    fetchSnapshot(date)
    {
        date = DateUtils.makeDate(date);

        var params = [ date ]; 
        return this._execute('FIND_SNAPSHOT', params)
            .then(results => {
                if (!results.length) {
                    return this._execute('INSERT_SNAPSHOT', params)
                        .then(insertResult => {
                            var newObj = {
                                id: insertResult.insertId,
                                date: date.toISOString()
                            };
                            return newObj;
                        });
                } else {
                    return _.head(results);
                }
            })
    }

    /* SNAPSHOT ITEMS BEGIN */
    insertSnapshotItem(snapshotId, dn, kind, configKind, name, config)
    {
        var params = [snapshotId, dn, kind, configKind, name, config]; 
        return this._execute('INSERT_SNAPSHOT_ITEM', params);
    }

    deleteSnapshotItem(snapshotId)
    {
        var params = [snapshotId]; 
        return this._execute('DELETE_SNAPSHOT_ITEM', params);
    }

    _makeDbSnapshotFromItems(items)
    {
        var snapshot = new Snapshot();
        for(var x of items)
        {
            var key = Helpers.makeKey(x);
            if (!snapshot.findById(key)) {
                snapshot._items[key] = {};
            }
            var id = x.id;
            delete x.id;
            snapshot._items[key][id] = x;
        }
        return snapshot;
    }

    persistConfigHashes(configHashes)
    {
        this.logger.info("[persistConfigHashes] BEGIN, count: %s", configHashes.length);

        return Promise.resolve()
            .then(() => {
                var statements = configHashes.map(x => {
                    return { 
                        id: 'INSERT_CONFIG_HASH',
                        params: [
                            x.config_hash,
                            x.config
                        ]
                    };
                })

                return this._executeMany(statements);
            })
            .then(() => {
                this.logger.info("[persistConfigHashes] END");
            });
    }

    syncSnapshotItems(snapshotId, snapshot)
    {
        this.logger.info("[syncSnapshotItems] BEGIN, item count: %s", snapshot.count);
        // this.logger.error("[syncSnapshotItems] BEGIN, SNAPSHOT!!!!!", snapshot.getDict()["root"]);

        return this._snapshotReader.querySnapshotItems(snapshotId)
            .then(dbItems => {
                var dbSnapshot = this._makeDbSnapshotFromItems(dbItems);
                this.logger.info("[syncSnapshotItems] dbSnapshot count: %s", dbSnapshot.count);

                this.debugObjectLogger.dump("history-snapshot-target", 0, snapshot);
                this.debugObjectLogger.dump("history-snapshot-db", 0, dbSnapshot);

                var itemsDelta = this._produceDelta(snapshot, dbSnapshot);
                this.logger.info("[syncSnapshotItems] itemsDelta count: %s", itemsDelta.length);

                this.debugObjectLogger.dump("history-items-delta", 0, itemsDelta);
                // this.logger.info("[syncSnapshotItems] ", itemsDelta);

                var statements = itemsDelta.map(x => {
                    if (x.action == 'C')
                    {
                        return { 
                            id: 'INSERT_SNAPSHOT_ITEM',
                            params: [
                                snapshotId,
                                x.item.dn,
                                x.item.kind,
                                x.item.config_kind,
                                x.item.name,
                                x.item.config_hash
                            ]
                        };
                    }
                    else if (x.action == 'U')
                    {
                        return { 
                            id: 'UPDATE_SNAPSHOT_ITEM',
                            params: [
                                x.item.dn,
                                x.item.kind,
                                x.item.config_kind,
                                x.item.name,
                                x.item.config_hash,
                                x.oldItemId
                            ]
                        };
                    } 
                    else if (x.action == 'D')
                    {
                        return { 
                            id: 'DELETE_SNAPSHOT_ITEM',
                            params: [
                                x.id
                            ]
                        };
                    }

                    this.logger.info("[syncSnapshotItems] INVALID delta: ", x);
                    throw new Error("INVALID");
                })

                return this._executeMany(statements);
            })
            .then(() => {
                this.logger.info("[syncSnapshotItems] END");
            });
    }

    /* SNAPSHOT ITEMS END */

    /* DIFF BEGIN */

    fetchDiff(snapshotId, date, in_snapshot, summary)
    {
        date = DateUtils.makeDate(date);
        var params = [snapshotId, date, in_snapshot]; 
        return this._execute('FIND_DIFF', params)
            .then(results => {
                if (!results.length) {
                    params = [snapshotId, date, in_snapshot, summary]; 
                    return this._execute('INSERT_DIFF', params)
                        .then(insertResult => {
                            var newObj = {
                                id: insertResult.insertId,
                                snapshot_id: snapshotId,
                                date: date.toISOString()
                            };
                            return newObj;
                        });
                } else {
                    return _.head(results);
                }
            })
    }

    /* DIFF END */

    /* DIFF ITEMS BEGIN */
    insertDiffItem(diffId, dn, kind, configKind, name, isPresent, config)
    {
        var params = [diffId, dn, kind, configKind, name, isPresent, config]; 
        return this._execute('INSERT_DIFF_ITEM', params);
    }

    deleteDiffItem(diffId)
    {
        var params = [diffId]; 
        return this._execute('DELETE_DIFF_ITEM', params);
    }

    syncDiffItems(diffId, diffSnapshot)
    {
        this.logger.info("[syncDiffItems] item count: %s", diffSnapshot.count);

        return this._snapshotReader.queryDiffItems(diffId)
            .then(dbItems => {
                var dbSnapshot = this._makeDbSnapshotFromItems(dbItems);

                var itemsDelta = this._produceDelta(diffSnapshot, dbSnapshot);

                var statements = itemsDelta.map(x => {

                    if (x.action == 'C')
                    {
                        return { 
                            id: 'INSERT_DIFF_ITEM',
                            params: [
                                diffId,
                                x.item.dn,
                                x.item.kind,
                                x.item.config_kind,
                                x.item.name,
                                x.item.present,
                                x.item.config_hash
                            ]
                        };
                    }
                    else if (x.action == 'U')
                    {
                        return { 
                            id: 'UPDATE_DIFF_ITEM',
                            params: [
                                x.item.dn,
                                x.item.kind,
                                x.item.config_kind,
                                x.item.name,
                                x.item.present,
                                x.item.config_hash,
                                x.oldItemId
                            ]
                        };
                    } 
                    else if (x.action == 'D')
                    {
                        return { 
                            id: 'DELETE_DIFF_ITEM',
                            params: [
                                x.id
                            ]
                        };
                    }

                    this.logger.error("[syncDiffItems] INVALID delta: ", x);
                    throw new Error("INVALID");
                })
                // this.logger.info('[syncDiffItems] ', statements);
                // throw new Error("INVALID");

                return this._executeMany(statements);
            });
    }

    /* DIFF ITEMS END */
    _produceDelta(targetSnapshot, dbSnapshot)
    {
        this.logger.info("[produceDelta] targetSnapshot count: %s",  targetSnapshot.count);
        var itemsDelta = [];

        for(var key of targetSnapshot.keys)
        {
            var shouldCreate = true;
            var targetItem = targetSnapshot.findById(key);

            var dbItemDict = dbSnapshot.findById(key)
            if (dbItemDict)
            {
                for(var id of _.keys(dbItemDict))
                {
                    var dbItem = dbItemDict[id];
                    if (shouldCreate)
                    {
                        shouldCreate = false;
                        if (!BufferUtils.areEqual(targetItem.config_hash, dbItem.config_hash))
                        {
                            itemsDelta.push({
                                action: 'U',
                                oldItemId: id,
                                reason: 'not-equal',
                                item: targetItem,
                                currentItem: dbItem
                            });
                        }
                    }
                    else
                    {
                        itemsDelta.push({
                            action: 'D',
                            id: id,
                            reason: 'already-found',
                            item: dbItemDict
                        });
                    }
                }
            }
            
            if (shouldCreate)
            {
                itemsDelta.push({
                    action: 'C',
                    item: targetItem,
                    reason: 'not-found'
                });
            }
        }

        for(var key of dbSnapshot.keys)
        {
            if (!targetSnapshot.findById(key))
            {
                for(var id of _.keys(dbSnapshot[key]))
                {
                    itemsDelta.push({
                        action: 'D',
                        id: id
                    });
                }
            }
        }

        return itemsDelta;
    }

    _registerStatement()
    {
        return this._driver.registerStatement.apply(this._driver, arguments);
    }

    _execute(statementId, params)
    {
        return this._driver.executeStatement(statementId, params);
    }

    _executeMany(statements)
    {
        return this._driver.executeStatements(statements);
    }

    executeInTransaction(cb)
    {
        return this._driver.executeInTransaction(cb);
    }

}

module.exports = HistoryDbAccessor;