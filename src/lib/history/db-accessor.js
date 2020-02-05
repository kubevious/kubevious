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
        this._registerStatement('GET_SNAPSHOT_ITEMS', 'SELECT * FROM `snap_items` WHERE `snapshot_id` = ?');

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

    insertSnapshotItem(snapshotId, dn, info, config)
    {
        var params = [snapshotId, dn, info, config]; 
        return this._execute('INSERT_SNAPSHOT_ITEM', params)
            .then(result => {
                this.logger.info("[insertSnapshotItem] ", result)
            })
    }

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

    querySnapshotItems(snapshotId)
    {
        return this._execute('GET_SNAPSHOT_ITEMS', [snapshotId])
            .then(results => {
                return results;
            })
    }

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
        // this.logger.info("NEW ITEMS: ", items)
        var newItemsMaps = {};
        for(var x of items)
        {
            var key = this._getDiffItemKey(x);
            if (!newItemsMaps[key]) {
                newItemsMaps[key] = {
                }
            }
            newItemsMaps[key] = x;
        }
        // this.logger.info("NEW ITEM MAP: ", newItemsMaps);

        return this.queryDiffItems(diffId)
            .then(currentItems => {
                // this.logger.info("CURRENT ITEMS: ", currentItems)

                var currentItemsMap = {};
                for(var x of currentItems)
                {
                    var key = this._getDiffItemKey(x);
                    if (!currentItemsMap[key]) {
                        currentItemsMap[key] = {
                        }
                    }
                    var id = x.id;
                    delete x.id;
                    currentItemsMap[key][id] = x;
                }
                // this.logger.info("CURRENT ITEM MAP: ", currentItemsMap)

                var itemsDelta = this._produceItemsDelta(newItemsMaps, currentItemsMap);
                // this.logger.info("ITEMS DELTA: ", itemsDelta);

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
                })
            })
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

    _produceItemsDelta(newItemsMaps, currentItemsMap)
    {
        var itemsDelta = [];

        for(var key of _.keys(newItemsMaps))
        {
            var shouldCreate = true;
            var newItem = newItemsMaps[key];
            if (currentItemsMap[key])
            {
                var found = false;
                for(var id of _.keys(currentItemsMap[key]))
                {
                    if (found)
                    {
                        itemsDelta.push({
                            present: false,
                            id: id
                        });
                    }
                    else
                    {
                        var currentItem = currentItemsMap[key][id];
                        if (_.fastDeepEqual(newItem, currentItem))
                        {
                            found = true;
                            shouldCreate = false;
                        }
                        else
                        {
                            itemsDelta.push({
                                present: false,
                                id: id
                            });
                        }
                    }
                }
            }
            
            if (shouldCreate)
            {
                itemsDelta.push({
                    present: true,
                    item: newItem
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

    /* DIFF ITEMS END */

    _registerStatement()
    {
        return this._driver.registerStatement.apply(this._driver, arguments);
    }

    _execute()
    {
        return this._driver.executeStatement.apply(this._driver, arguments);
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