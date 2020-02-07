const Promise = require('the-promise');
const _ = require('the-lodash');

class HistoryDbAccessor
{
    constructor(logger, driver)
    {
        this._logger = logger.sublogger('HistoryDbAccessor');
        this._driver = driver;

        this._registerStatements();
    }

    get logger() {
        return this._logger;
    }

    _registerStatements()
    {
        this._registerStatement('GET_SNAPSHOTS', 'SELECT * FROM `snapshots`;');
        this._registerStatement('FIND_SNAPSHOT', 'SELECT * FROM `snapshots` WHERE `date` = ? ORDER BY `id` DESC LIMIT 1;');
        this._registerStatement('INSERT_SNAPSHOT', 'INSERT INTO `snapshots` (`date`) VALUES (?);');

        this._registerStatement('INSERT_SNAPSHOT_ITEM', 'INSERT INTO `snap_items` (`snapshot_id`, `dn`, `info`, `config`) VALUES (?, ?, ?, ?);');
        this._registerStatement('UPDATE_SNAPSHOT_ITEM', 'UPDATE `snap_items` SET `dn` = ?, `info` = ?, `config` = ? WHERE `id` = ?;');
        this._registerStatement('DELETE_SNAPSHOT_ITEM', 'DELETE FROM `snap_items` WHERE `id` = ?;');
        this._registerStatement('GET_SNAPSHOT_ITEMS', 'SELECT `id`, `dn`, `info`, `config` FROM `snap_items` WHERE `snapshot_id` = ?');
        

        this._registerStatement('FIND_DIFF', 'SELECT * FROM `diffs` WHERE `snapshot_id` = ? AND `date` = ? ORDER BY `id` DESC LIMIT 1;');
        this._registerStatement('INSERT_DIFF', 'INSERT INTO `diffs` (`snapshot_id`, `date`) VALUES (?, ?);');

        this._registerStatement('INSERT_DIFF_ITEM', 'INSERT INTO `diff_items` (`diff_id`, `dn`, `info`, `present`, `config`) VALUES (?, ?, ?, ?, ?);');
        this._registerStatement('DELETE_DIFF_ITEM', 'DELETE FROM `diff_items` WHERE `id` = ?;');
        this._registerStatement('GET_DIFF_ITEMS', 'SELECT `id`, `dn`, `info`, `present`, `config` FROM `diff_items` WHERE `diff_id` = ?');

        this._registerStatement('GET_DIFFS', 'SELECT * FROM diffs;');
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

    querySnapshotItems(snapshotId)
    {
        return this._execute('GET_SNAPSHOT_ITEMS', [snapshotId]);
    }

    deleteSnapshotItem(snapshotId)
    {
        var params = [snapshotId]; 
        return this._execute('DELETE_SNAPSHOT_ITEM', params);
    }

    syncSnapshotItems(snapshotId, items)
    {
        this.logger.info("[syncSnapshotItems] BEGIN, item count: %s", items.length);

        return this.querySnapshotItems(snapshotId)
            .then(currentItems => {
                this.logger.info("[syncSnapshotItems] currentItems count: %s", currentItems.length);

                {
                    var s = _.cloneDeep(items);
                    var writer = this.logger.outputStream("history-items-new.json");
                    if (writer) {
                        writer.write(s);
                        writer.close();
                    }
                }
    
                {
                    var s = _.cloneDeep(currentItems);
                    var writer = this.logger.outputStream("history-items-current.json");
                    if (writer) {
                        writer.write(s);
                        writer.close();
                    }
                }

                var itemsDelta = this._produceDelta(
                    items, 
                    currentItems, 
                    this._getSnapshotItemKey.bind(this));
                this.logger.info("[syncSnapshotItems] itemsDelta count: %s", itemsDelta.length);

                {
                    var s = _.cloneDeep(itemsDelta);
                    var writer = this.logger.outputStream("history-items-delta.json");
                    if (writer) {
                        writer.write(s);
                        writer.close();
                    }
                }
                // this.logger.info("[syncSnapshotItems] ", itemsDelta);

                var statements = itemsDelta.map(x => {
                    if (x.present) {
                        if (x.oldItemId)
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
                        else
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
                    } else {
                        return { 
                            id: 'DELETE_SNAPSHOT_ITEM',
                            params: [
                                x.id
                            ]
                        };
                    }
                })

                return this._executeMany(statements);
            })
            .then(() => {
                this.logger.info("[syncSnapshotItems] END");
            });
    }

    _getSnapshotItemKeyInfo(item)
    {
        return {
            dn: item.dn,
            info: item.info
        };
    }

    _getSnapshotItemKey(item)
    {
        return _.stableStringify(this._getSnapshotItemKeyInfo(item));
    }

    /* SNAPSHOT ITEMS END */

    /* DIFF BEGIN */

    fetchDiff(snapshotId, date)
    {
        var params = [snapshotId, toMysqlFormat(date)]; 
        return this._execute('FIND_DIFF', params)
            .then(results => {
                if (!results.length) {
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

    queryDiffItems(diffId)
    {
        return this._execute('GET_DIFF_ITEMS', [diffId]);
    }

    deleteDiffItem(diffId)
    {
        var params = [diffId]; 
        return this._execute('DELETE_DIFF_ITEM', params);
    }

    syncDiffItems(diffId, items)
    {
        return this.queryDiffItems(diffId)
            .then(currentItems => {

                var itemsDelta = this._produceDelta(
                    items, 
                    currentItems, 
                    this._getDiffItemKey.bind(this));
                
                return Promise.serial(itemsDelta, delta => {
                    if (delta.present)
                    {
                        return this.insertDiffItem(diffId, 
                            delta.item.dn,
                            delta.item.info,
                            delta.item.present,
                            delta.item.config);
                    }
                    else
                    {
                        return this.deleteDiffItem(delta.id);
                    }
                });
            });
    }

    _getDiffItemKeyInfo(item)
    {
        return {
            dn: item.dn,
            info: item.info
        };
    }

    _getDiffItemKey(item)
    {
        return _.stableStringify(this._getDiffItemKeyInfo(item));
    }

    /* DIFF ITEMS END */

    _produceDelta(items, currentItems, keyFunc)
    {
        var newItemsMaps = {};
        for(var x of items)
        {
            var key = keyFunc(x);
            if (!newItemsMaps[key]) {
                newItemsMaps[key] = {
                }
            }
            newItemsMaps[key] = x;
        }

        var currentItemsMap = {};
        for(var x of currentItems)
        {
            var key = keyFunc(x);
            if (!currentItemsMap[key]) {
                currentItemsMap[key] = {
                }
            }
            var id = x.id;
            delete x.id;
            currentItemsMap[key][id] = x;
        }

        var itemsDelta = this._produceItemsDelta(newItemsMaps, currentItemsMap);
        return itemsDelta;
    }

    _produceItemsDelta(newItemsMaps, currentItemsMap)
    {
        var itemsDelta = [];

        for(var key of _.keys(newItemsMaps))
        {
            var shouldCreate = true;
            var newItem = newItemsMaps[key];
            if (currentItemsMap[key])
            {
                for(var id of _.keys(currentItemsMap[key]))
                {
                    if (shouldCreate)
                    {
                        shouldCreate = false;
                        var currentItem = currentItemsMap[key][id];
                        if (!_.fastDeepEqual(newItem, currentItem))
                        {
                            itemsDelta.push({
                                present: true,
                                oldItemId: id,
                                reason: 'not-equal',
                                item: newItem
                            });
                        }
                    }
                    else
                    {
                        itemsDelta.push({
                            present: false,
                            id: id,
                            reason: 'already-found',
                            item: currentItemsMap[key][id]
                        });
                    }
                }
            }
            
            if (shouldCreate)
            {
                itemsDelta.push({
                    present: true,
                    item: newItem,
                    reason: 'not-found'
                });
            }
        }

        for(var key of _.keys(currentItemsMap))
        {
            if (!newItemsMaps[key])
            {
                for(var id of _.keys(currentItemsMap[key]))
                {
                    itemsDelta.push({
                        present: false,
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

}


function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}
function toMysqlFormat(date)
{
    return date.getUTCFullYear() + "-" + 
        twoDigits(1 + date.getUTCMonth()) + "-" + 
        twoDigits(date.getUTCDate()) + " " + 
        twoDigits(date.getUTCHours()) + ":" + 
        twoDigits(date.getUTCMinutes()) + ":" + 
        twoDigits(date.getUTCSeconds());
};

module.exports = HistoryDbAccessor;