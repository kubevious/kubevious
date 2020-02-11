const Promise = require('the-promise');
const _ = require('the-lodash');
const SnapshotReader = require('./snapshot-reader');
const Helpers = require('./helpers');
const Snapshot = require('./snapshot');

class HistoryDbAccessor
{
    constructor(logger, driver)
    {
        this._logger = logger.sublogger('HistoryDbAccessor');
        this._driver = driver;
        this._snapshotReader = new SnapshotReader(logger, driver);

        this._registerStatements();
    }

    get logger() {
        return this._logger;
    }

    get snapshotReader() {
        return this._snapshotReader;
    }

    _registerStatements()
    {
        this._registerStatement('GET_SNAPSHOTS', 'SELECT * FROM `snapshots`;');
        this._registerStatement('FIND_SNAPSHOT', 'SELECT * FROM `snapshots` WHERE `date` = ? ORDER BY `id` DESC LIMIT 1;');
        this._registerStatement('INSERT_SNAPSHOT', 'INSERT INTO `snapshots` (`date`) VALUES (?);');

        this._registerStatement('INSERT_SNAPSHOT_ITEM', 'INSERT INTO `snap_items` (`snapshot_id`, `dn`, `info`, `config`) VALUES (?, ?, ?, ?);');
        this._registerStatement('UPDATE_SNAPSHOT_ITEM', 'UPDATE `snap_items` SET `dn` = ?, `info` = ?, `config` = ? WHERE `id` = ?;');
        this._registerStatement('DELETE_SNAPSHOT_ITEM', 'DELETE FROM `snap_items` WHERE `id` = ?;');

        this._registerStatement('FIND_DIFF', 'SELECT * FROM `diffs` WHERE `snapshot_id` = ? AND `date` = ? AND `in_snapshot` = ? ORDER BY `id` DESC LIMIT 1;');
        this._registerStatement('INSERT_DIFF', 'INSERT INTO `diffs` (`snapshot_id`, `date`, `in_snapshot`, `summary`) VALUES (?, ?, ?, ?);');

        this._registerStatement('INSERT_DIFF_ITEM', 'INSERT INTO `diff_items` (`diff_id`, `dn`, `info`, `present`, `config`) VALUES (?, ?, ?, ?, ?);');
        this._registerStatement('UPDATE_DIFF_ITEM', 'UPDATE `diff_items` SET `dn` = ?, `info` = ?, `present` = ?, `config` = ? WHERE `id` = ?;');
        this._registerStatement('DELETE_DIFF_ITEM', 'DELETE FROM `diff_items` WHERE `id` = ?;');

        this._registerStatement('GET_DIFFS', 'SELECT * FROM diffs;');

        this._registerStatement('GET_CONFIG', 'SELECT * FROM `config` WHERE `key` = ?;');
        this._registerStatement('SET_CONFIG', 'INSERT INTO `config`(`key`, `value`) VALUES(?, ?) ON DUPLICATE KEY UPDATE `key` = ?, `value` = ?;');
    }

    updateConfig(key, value)
    {
        var params = [key, value, key, value]; 
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
        var params = [toMysqlFormat(date)]; 
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
    insertSnapshotItem(snapshotId, dn, info, config)
    {
        var params = [snapshotId, dn, info, config]; 
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

    syncSnapshotItems(snapshotId, snapshot)
    {
        this.logger.info("[syncSnapshotItems] BEGIN, item count: %s", snapshot.count);
        // this.logger.error("[syncSnapshotItems] BEGIN, SNAPSHOT!!!!!", snapshot.getDict()["root"]);

        return this._snapshotReader.querySnapshotItems(snapshotId)
            .then(dbItems => {
                var dbSnapshot = this._makeDbSnapshotFromItems(dbItems);
                this.logger.info("[syncSnapshotItems] dbSnapshot count: %s", dbSnapshot.count);

                {
                    var writer = this.logger.outputStream("history-snapshot-target.json");
                    if (writer) {
                        writer.write(_.cloneDeep(snapshot));
                        writer.close();
                    }
                }
    
                {
                    var writer = this.logger.outputStream("history-snapshot-db.json");
                    if (writer) {
                        writer.write(_.cloneDeep(dbSnapshot));
                        writer.close();
                    }
                }

                var itemsDelta = this.produceDelta(snapshot, dbSnapshot);
                this.logger.info("[syncSnapshotItems] itemsDelta count: %s", itemsDelta.length);

                {
                    var writer = this.logger.outputStream("history-items-delta.json");
                    if (writer) {
                        writer.write(_.cloneDeep(itemsDelta));
                        writer.close();
                    }
                }
                // this.logger.info("[syncSnapshotItems] ", itemsDelta);

                var statements = itemsDelta.map(x => {
                    if (x.action == 'C')
                    {
                        return { 
                            id: 'INSERT_SNAPSHOT_ITEM',
                            params: [
                                snapshotId,
                                x.item.dn,
                                x.item.info,
                                x.item.config
                            ]
                        };
                    }
                    else if (x.action == 'U')
                    {
                        return { 
                            id: 'UPDATE_SNAPSHOT_ITEM',
                            params: [
                                x.item.dn,
                                x.item.info,
                                x.item.config,
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
        date = makeDate(date);
        var params = [snapshotId, toMysqlFormat(date), in_snapshot]; 
        return this._execute('FIND_DIFF', params)
            .then(results => {
                if (!results.length) {
                    params = [snapshotId, toMysqlFormat(date), in_snapshot, summary]; 
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
    insertDiffItem(diffId, dn, info, isPresent, config)
    {
        var params = [diffId, dn, info, isPresent, config]; 
        return this._execute('INSERT_DIFF_ITEM', params);
    }

    deleteDiffItem(diffId)
    {
        var params = [diffId]; 
        return this._execute('DELETE_DIFF_ITEM', params);
    }

    syncDiffItems(diffId, diffSnapshot)
    {
        this.logger.info("[syncDiffItems] item count: ", diffSnapshot.count);

        return this._snapshotReader.queryDiffItems(diffId)
            .then(dbItems => {
                var dbSnapshot = this._makeDbSnapshotFromItems(dbItems);

                var itemsDelta = this.produceDelta(diffSnapshot, dbSnapshot);
                // this.logger.info('[syncDiffItems] itemsDelta: ', itemsDelta);

                var statements = itemsDelta.map(x => {
                    if (x.action == 'C')
                    {
                        return { 
                            id: 'INSERT_DIFF_ITEM',
                            params: [
                                diffId,
                                x.item.dn,
                                x.item.info,
                                x.item.present,
                                x.item.config
                            ]
                        };
                    }
                    else if (x.action == 'U')
                    {
                        return { 
                            id: 'UPDATE_DIFF_ITEM',
                            params: [
                                x.item.dn,
                                x.item.info,
                                x.item.present,
                                x.item.config,
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

                    this.logger.info("[syncDiffItems] INVALID delta: ", x);
                    throw new Error("INVALID");
                })
                // this.logger.info('[syncDiffItems] ', statements);

                return this._executeMany(statements);
            });
    }

    /* DIFF ITEMS END */
    produceDelta(targetSnapshot, dbSnapshot)
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
                        if (!_.fastDeepEqual(targetItem, dbItem))
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

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}
function toMysqlFormat(date)
{
    date = makeDate(date);
    return date.getUTCFullYear() + "-" + 
        twoDigits(1 + date.getUTCMonth()) + "-" + 
        twoDigits(date.getUTCDate()) + " " + 
        twoDigits(date.getUTCHours()) + ":" + 
        twoDigits(date.getUTCMinutes()) + ":" + 
        twoDigits(date.getUTCSeconds());
};
function makeDate(date)
{
    if (_.isString(date)) {
        date = new Date(date);
    }
    return date;
};

module.exports = HistoryDbAccessor;