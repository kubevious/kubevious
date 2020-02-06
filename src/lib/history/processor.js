const Promise = require('the-promise');
const _ = require('the-lodash');
const HistoryAccessor = require("./db-accessor");

class HistoryProcessor
{
    constructor(context)
    {
        this._logger = context.logger.sublogger('HistoryProcessor');
        this._dbAccessor = new HistoryAccessor(this.logger, context.mysqlDriver);
    }

    get logger() {
        return this._logger;
    }

    acceptSnapshot(itemsMap)
    {
        this._logger.info("[acceptItems] ...");

        var snapshot = null;
        return Promise.resolve()
            .then(() => {
                snapshot = this._produceSnapshot(itemsMap);
                // this._logger.info("SNAPSHOT: ", snapshot);
                this._logger.info("SNAPSHOT ITEM COUNT: %s :: %s ", snapshot.date.toISOString(), snapshot.items.length);
            })
            .then(() => {
                var s = _.cloneDeep(snapshot);
                var writer = this.logger.outputStream("history-snapshot.json");
                if (writer) {
                    writer.write(s);
                    writer.close();
                }
            })
            .then(() => this._persistSnapshot(snapshot))
            .catch(reason => {
                this.logger.error(reason);
            });
    }

    _persistSnapshot(snapshot)
    {
        return Promise.resolve()
            .then(() => this._dbAccessor.fetchSnapshot(snapshot.date))
            .then(dbSnapshot => {
                this.logger.info("[_persistSnapshot] ", dbSnapshot);
                // this.logger.info("[_persistSnapshot] sample: ", snapshot.items[10]);
                return this._dbAccessor.syncSnapshotItems(dbSnapshot.id, snapshot.items);
            })
    }

    _produceSnapshot(itemsMap)
    {
        var snapshotItems = [];
        for(var item of _.values(itemsMap))
        {
            snapshotItems.push({
                dn: item.dn,
                info: null,
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
                    info: { kind: 'props' },
                    config: props
                })
            }
        }

        return {
            date: new Date("2020-02-07 02:18:22"),
            items: snapshotItems
        };
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