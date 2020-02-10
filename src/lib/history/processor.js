const Promise = require('the-promise');
const _ = require('the-lodash');
const HistoryAccessor = require("./db-accessor");
const Helpers = require('./helpers');
const Snapshot = require('./snapshot');

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
        this._currentState = null;

        context.mysqlDriver.onConnect(this._onDbConnected.bind(this));
    }

    get logger() {
        return this._logger;
    }

    acceptSnapshot(logicItemsMap)
    {
        this._logger.info("[acceptItems] ...");

        var snapshot = this._produceSnapshot(logicItemsMap);
        this._logger.info("[acceptItems] snapshot item count: %s", snapshot.getItems().length);
        // this._logger.info("[acceptItems] snapshot item count: ", _.keys(snapshot.getDict()));

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

                return this._dbAccessor.executeInTransaction(() => {
                    return Promise.resolve()
                        .then(() => this._persistSnapshot(snapshot))
                        .then(() => this._persistDiff(snapshot))
                        .then(() => this._persistConfig())
                });

            })
            .then(() => {
                this._latestSnapshot = snapshot;
            })
            .catch(reason => {
                this.logger.error(reason);
            });
    }

    _persistSnapshot(snapshot)
    {
        this._itemsDelta = this._dbAccessor.produceDelta(snapshot, this._latestSnapshot);

        if (this._currentState.snapshot_id) {
            return;
        }

        return this._dbAccessor.fetchSnapshot(snapshot.date)
            .then(dbSnapshot => {
                this._currentState.snapshot_id = dbSnapshot.id;
                this._currentState.snapshot_date = dbSnapshot.date;
                this._currentState.diff_in_snapshot = true;
                this._currentState.diff_count = 0;
                this._currentState.diff_item_count = 0;

                this.logger.info("[_persistSnapshot] ", dbSnapshot);
                return this._dbAccessor.syncSnapshotItems(dbSnapshot.id, snapshot);
            });
    }

    _persistDiff(snapshot)
    {
        this.logger.info('[_persistDiff] ', this._currentState);

        return this._dbAccessor.fetchDiff(this._currentState.snapshot_id,
                                          snapshot.date,
                                          this._currentState.diff_in_snapshot)
            .then(dbDiff => {
                this._currentState.diff_id = dbDiff.id;
                this._currentState.diff_date = dbDiff.date;
                this._currentState.diff_in_snapshot = false;
                this._currentState.diff_count += 1;

                var itemsDelta = this._dbAccessor.produceDelta(snapshot, this._latestSnapshot);
                this._currentState.diff_item_count += itemsDelta.length;

                var diffSnapshot = new Snapshot();
                for(var x of itemsDelta)
                {
                    var newItem = _.clone(x.item);
                    if (x.action == 'C' || x.action == 'U')
                    {
                        newItem.present = 1;
                    }
                    else
                    {
                        newItem.present = 0;
                    }
                    diffSnapshot.addItem(newItem);
                }

                return this._dbAccessor.syncDiffItems(dbDiff.id, diffSnapshot);
            })
    }

    _persistConfig()
    {
        return this._dbAccessor.updateConfig('STATE', this._currentState);
    }

    _produceSnapshot(logicItemsMap)
    {
        var snapshot = new Snapshot();

        for(var item of _.values(logicItemsMap))
        {
            snapshot.addItem({
                dn: item.dn,
                info: { kind: 'node' },
                config: item.exportNode()
            });

            var alerts = item.extractAlerts();
            if (alerts.length > 0) 
            {
                snapshot.addItem({
                    dn: item.dn,
                    info: { kind: 'alerts' },
                    config: item.extractAlerts()
                });
            }

            var properties = item.extractProperties();
            for(var props of properties)
            {
                snapshot.addItem({
                    dn: item.dn,
                    info: { kind: 'props', name: props.id },
                    config: props
                })
            }
        }

        snapshot.setDate(new Date("2020-02-07 02:18:22"));
        return snapshot;
    }

    _onDbConnected()
    {
        this._logger.info("[_onDbConnected] ...");
        this._latestSnapshot = null;
        return Promise.resolve()
            .then(() => this._dbAccessor.queryConfig('STATE'))
            .then(config => {
                this._currentState = config.value || {};
                this._logger.info("[_onDbConnected] state: ", this._currentState);
            })
            .then(() => this._dbAccessor.snapshotReader.reconstructRecentShaphot())
            .then(snapshot => {
                this._logger.info("[_onDbConnected] reconstructed snapshot item count: %s",
                    snapshot.count);

                this._latestSnapshot = snapshot;

                return this._tryProcessSnapshot();
            })
    }

    _tryProcessSnapshot()
    {
        if (this._isProcessing) {
            return;
        }

        if (!this._currentState) {
            this._logger.warn("[_tryProcessSnapshot] state not fetched");
            return;
        }

        if (!this._latestSnapshot) {
            this._logger.warn("[_tryProcessSnapshot] snapshot not yet fetched");
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

module.exports = HistoryProcessor;