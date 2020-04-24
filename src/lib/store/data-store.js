const Promise = require('the-promise');
const _ = require('lodash');
const Snapshot = require("kubevious-helpers").History.Snapshot;
const RedisClient = require("kubevious-helpers").RedisClient;

class DataStore
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("DataStore");
        this.logger.info("[construct]");

        // this._client = new RedisClient(this.logger);
    }

    get logger() {
        return this._logger;
    }

    init()
    {
        this.logger.info("[init]");

        return Promise.resolve()
            // .then(() => this._client.init())
            ;
    }

    accept(snapshotInfo)
    {
        this._logger.info("[accept] begin");
        // var snapshot = this._produceSnapshot(_.values(snapshotInfo.items), snapshotInfo.date);
        // this._logger.info("[accept] snapshot %s, item count: %s", snapshot.date.toISOString(), snapshot.getItems().length);
        // this._storeSnapshot(snapshot);
    }

    _produceSnapshot(items, date)
    {
        this._logger.info("[_produceSnapshot] date: %s, count: %s", date.toISOString(), items.length);

        var snapshot = new Snapshot(date);

        for(var item of items)
        {
            var cloned = _.clone(item);
            snapshot.addItem(cloned);
        }

        return snapshot;
    }

    _storeSnapshot(snapshot)
    {
        this.logger.info("[_storeSnapshot] begin");
        return this._client.listKeys("ru*")
            .then(keys => {
                this.logger.info("[_storeSnapshot] keys: ", keys);
            })
    }
}

module.exports = DataStore;