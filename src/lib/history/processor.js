const Promise = require('the-promise');
const _ = require('the-lodash');

class HistoryProcessor
{
    constructor(context)
    {
        this._logger = context.logger.sublogger('HistoryProcessor');
    }

    get logger() {
        return this._logger;
    }

    acceptSnapshot(itemsMap)
    {
        this._logger.info("[acceptItems] ...");

        var snapshot = this._produceSnapshot(itemsMap);
        // this._logger.info("SNAPSHOT: ", snapshot);
        this._logger.info("SNAPSHOT ITEM COUNT: %s :: %s ", snapshot.date.toISOString(), snapshot.items.length);
    }

    _produceSnapshot(itemsMap)
    {
        var snapshotItems = [];
        for(var item of _.values(itemsMap))
        {
            snapshotItems.push({
                dn: item.dn,
                config: item.exportNode()
            });

            snapshotItems.push({
                dn: item.dn,
                info: { kind: 'alerts' },
                config: item.extractAlerts()
            });

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
            date: new Date(),
            items: snapshotItems
        };
    }
}



module.exports = HistoryProcessor;