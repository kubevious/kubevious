const Promise = require('the-promise');
const _ = require('the-lodash');
const HistoryAccessor = require("./db-accessor");

class HistoryProcessor
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('HistoryProcessor');
        this._dbAccessor = new HistoryAccessor(this.logger, context.mysqlDriver);
        this._snapshotQueue = [];
        this._isProcessing = false;
        this._latestSnapshot = null;

        context.mysqlDriver.onConnect(this._onDbConnected.bind(this));
    }

    get logger() {
        return this._logger;
    }

    acceptSnapshot(itemsMap)
    {
        this._logger.info("[acceptItems] ...");

        var snapshot = this._produceSnapshot(itemsMap);
        this._logger.info("[acceptItems] snapshot item count: %s", snapshot.items.length);
        this._snapshotQueue.push(snapshot);
        while(this._snapshotQueue.length > 10) {
            this._snapshotQueue.shift();
        }
        this._tryProcessSnapshot();
    }

    _processSnapshot(snapshot)
    {
        return Promise.resolve()
            .then(() => {
                var writer = this.logger.outputStream("history-snapshot.json");
                if (writer) {
                    writer.write(_.cloneDeep(snapshot));
                    writer.close();
                }
            })
            .then(() => {
                if (this._shouldProcessAsDiff(snapshot))
                {
                    return this._persistDiff(snapshot);
                }
                else
                {
                    return this._persistSnapshot(snapshot);
                }
            })
            .then(() => {
                this._latestSnapshot = snapshot;
            })
            .catch(reason => {
                this.logger.error(reason);
            });
    }

    _shouldProcessAsDiff(snapshot)
    {
        if (this._latestSnapshot)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    _persistSnapshot(snapshot)
    {
        return Promise.resolve()
            .then(() => this._dbAccessor.fetchSnapshot(snapshot.date))
            .then(dbSnapshot => {
                this.logger.info("[_persistSnapshot] ", dbSnapshot);
                return this._dbAccessor.syncSnapshotItems(dbSnapshot.id, snapshot.items);
            })
    }

    _persistDiff(snapshot)
    {
        return Promise.resolve()
            .then(() => this._dbAccessor.fetchSnapshot(snapshot.date))
            .then(dbSnapshot => {
                return this._dbAccessor.fetchDiff(dbSnapshot.id, snapshot.date);
            })
            .then(dbDiff => {
                this.logger.info('[_persistDiff] ', dbDiff);
                var itemsDelta = this._dbAccessor.produceDelta(snapshot.items, this._latestSnapshot.items);
                itemsDelta = itemsDelta.map(x => {
                    var newItem = _.clone(x.item);
                    if (x.action == 'C' || x.action == 'U')
                    {
                        newItem.present = 1;
                    }
                    else
                    {
                        newItem.present = 0;
                    }
                    return newItem;
                });
                return this._dbAccessor.syncDiffItems(dbDiff.id, itemsDelta);
            })
    }

    _produceSnapshot(itemsMap)
    {
        var snapshotItems = [];
        for(var item of _.values(itemsMap))
        {
            snapshotItems.push({
                dn: item.dn,
                info: { kind: 'node' },
                config: item.exportNode()
            });

            var alerts = item.extractAlerts();
            if (alerts.length > 0) 
            {
                snapshotItems.push({
                    dn: item.dn,
                    info: { kind: 'alerts' },
                    config: item.extractAlerts()
                });
            }

            var properties = item.extractProperties();
            for(var props of properties)
            {
                snapshotItems.push({
                    dn: item.dn,
                    info: { kind: 'props', name: props.id },
                    config: props
                })
            }
        }

        return {
            date: new Date("2020-02-07 02:18:22"),
            items: snapshotItems
        };
    }

    _onDbConnected()
    {
        this._logger.info("[_onDbConnected] ...");
        return this._tryProcessSnapshot();
    }

    _tryProcessSnapshot()
    {
        if (this._isProcessing) {
            return;
        }

        this._logger.info("[_tryProcessSnapshot] BEGIN");
        if (!this._context.mysqlDriver.isConnected)
        {
            this._logger.warn("[_tryProcessSnapshot] not connected to db");
            return;
        }
        this._logger.info("[_tryProcessSnapshot] snapshots in queue: %s", this._snapshotQueue.length);
        if (this._snapshotQueue.length == 0) {
            this._logger.info("[_tryProcessSnapshot] empty");
            return;
        }
        this._isProcessing = true;
        var snapshot = _.head(this._snapshotQueue);
        return this._processSnapshot(snapshot)
            .then(() => {
                this._logger.info("[_tryProcessSnapshot] END");

                this._snapshotQueue.shift();
                this._isProcessing = false;
                return this._tryProcessSnapshot();
            })
            .catch(reason => {
                this._isProcessing = false;
                this._logger.error("[_tryProcessSnapshot] ", reason);
            });
    }
}

// var unhandledPromises = [];
// Promise.onPossiblyUnhandledRejection(function(reason, promise) {
//     unhandledPromises.push(promise);
//     //Update some debugger UI
//     console.log('[onPossiblyUnhandledRejection]')
// });

// Promise.onUnhandledRejectionHandled(function(promise) {
//     var index = unhandledPromises.indexOf(promise);
//     unhandledPromises.splice(index, 1);
//     //Update the debugger UI
//     console.log('[onUnhandledRejectionHandled]')
// });

module.exports = HistoryProcessor;