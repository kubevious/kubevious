const crypto = require('crypto');
const Promise = require('the-promise');
const _ = require('the-lodash');
const HistoryAccessor = require("./db-accessor");
const Snapshot = require("kubevious-helpers").History.Snapshot;
const BufferUtils = require("kubevious-helpers").BufferUtils;

class HistoryProcessor
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('HistoryProcessor');
        this._dbAccessor = new HistoryAccessor(context, context.database);
        this._latestSnapshot = null;
        this._currentState = null;
        this._interation = 0;
        this._isDbReady = false;
        this._usedHashesDict = {};
        this._statesQueue = [];

        this._isLocked = false;
        this._isProcessing = false;
        this._processFinishListeners = [];

        context.database.onConnect(this._onDbConnected.bind(this));
    }

    get logger() {
        return this._logger;
    }

    get debugObjectLogger() {
        return this._context.debugObjectLogger;
    }

    lockForCleanup(cb)
    {
        var handler = {
            finish: () => {
                this._resumeProcessing();
            }
        }

        this._isLocked = true;
        if (!this._isProcessing) {
            cb(handler);
        } else {
            this._processFinishListeners.push(() => {
                cb(handler);
            });
        }
    }

    accept(state)
    {
        this._addToQueue(state);
        return this._safeProcessQueue();
    }

    _resumeProcessing()
    {
        this._isLocked = false;
        this._safeProcessQueue();
    }

    _safeProcessQueue()
    {
        return Promise.resolve()
            .then(() => this._processQueue())
            .catch(reason => {
                this.logger.error(reason);
            });
    }

    _processQueue() 
    {
        if (this._statesQueue.length == 0) {
            return;
        }
        if (this._isLocked) {
            return Promise.resolve(30 * 1000);
        }

        if (this._isProcessing) {
            return;
        }
        this._isProcessing = true;

        var state = this._statesQueue.shift();
        return this._processQueueItem(state)
            .finally(() => {
                this._isProcessing = false;
            })
            .then(() => {
                return this._processQueue();
            })
    }

    _processQueueItem(state)
    {
        this._logger.info("[_processQueueItem] begin");
        var snapshot = this._produceSnapshot(state);
        this._logger.info("[_processQueueItem] snapshot %s, item count: %s", snapshot.date.toISOString(), snapshot.getItems().length);

        return this._processSnapshot(snapshot)
            .then(() => {
                for(var x of this._processFinishListeners)
                {
                    x();
                }
                this._processFinishListeners = [];
            });
    }

    _addToQueue(state)
    {
        this._statesQueue.push(state);
        this._statesQueue = _.takeRight(this._statesQueue, 1);
        this.logger.info("[_addToQueue] Size: %s", this._statesQueue.length);
    }

    _processSnapshot(snapshot)
    {
        this.logger.info("[_processSnapshot] BEGIN. %s, Item Count: %s", snapshot.date.toISOString(), snapshot.count);

        return Promise.resolve()
            .then(() => this.debugObjectLogger.dump("history-snapshot", 0, snapshot))
            .then(() => {

                this._interation += 1;

                var configHashes = this._produceConfigHashes(snapshot);
                var itemsDelta = this._produceDelta(snapshot, this._latestSnapshot);
                var deltaSummary = this._constructDeltaSummary(snapshot, itemsDelta);
                this._cleanupSnapshot(snapshot);

                return Promise.resolve()
                    .then(() => this.debugObjectLogger.dump("history-diff-snapshot-", this._interation, snapshot))
                    .then(() => this.debugObjectLogger.dump("history-diff-latest-snapshot-", this._interation, this._latestSnapshot))
                    .then(() => this.debugObjectLogger.dump("history-diff-items-delta-", this._interation, itemsDelta))
                    .then(() => {
                        return this._dbAccessor.executeInTransaction(() => {
                            return Promise.resolve()
                                .then(() => this._persistConfigHashes(configHashes))
                                .then(() => this._persistSnapshot(snapshot))
                                .then(() => this._persistDiff(snapshot, itemsDelta, deltaSummary))
                                .then(() => this._persistConfig())
                        });
                    })
            })
            .then(() => {
                this.logger.info("[_processSnapshot] END");

                this._latestSnapshot = snapshot;
            })
            .catch(reason => {
                this.logger.error(reason);
            });
    }

    _produceConfigHashes(snapshot)
    {
        var configHashes = [];
        for(var item of snapshot.getItems())
        {
            var hash = this._calculateObjectHash(item.config);
            configHashes.push({ config_hash: hash, config: item.config })
            item.config_hash = hash;
        }
        return configHashes;
    }

    _cleanupSnapshot(snapshot)
    {
        for(var item of snapshot.getItems())
        {
            delete item.config;
        }
    }

    _calculateObjectHash(obj)
    {
        if (_.isNullOrUndefined(obj)) {
            throw new Error('NO Object');
        }

        var str = _.stableStringify(obj);

        const sha256 = crypto.createHash('sha256');
        sha256.update(str);
        var value = sha256.digest();
        return value;
    }

    _persistConfigHashes(configHashes)
    {
        var newHashes = configHashes.filter(x => !this._usedHashesDict[x.config_hash]);
        return Promise.resolve()
            .then(() => {
                return this._dbAccessor.persistConfigHashes(newHashes);
            })
            .then(() => {
                for(var x of newHashes)
                {
                    this._usedHashesDict[x.config_hash] = true;
                }
            });
    }

    _persistSnapshot(snapshot)
    {
        if (!this._shouldCreateNewDbSnapshot(snapshot)) {
            return;
        }
        this.logger.info("[_persistSnapshot] BEGIN. Item Count: %s", snapshot.count, this._currentState);
        return this._dbAccessor.fetchSnapshot(snapshot.date)
            .then(dbSnapshot => {
                this.logger.info("[_persistSnapshot] ", dbSnapshot);

                this._resetSnapshotState();

                this._currentState.snapshot_id = dbSnapshot.id;
                this._currentState.snapshot_date = dbSnapshot.date;
            })
            .then(() => {
                return this._dbAccessor.syncSnapshotItems(this._currentState.snapshot_id, snapshot);
            })
            .then(() => {
                this.logger.info("[_persistSnapshot] END");
            });
    }

    _shouldCreateNewDbSnapshot(snapshot)
    {
        if (!this._currentState.snapshot_id) {
            return true;
        }

        if (this._currentState.diff_count > 50) {
            return true;
        }

        return false;
    }

    _persistDiff(snapshot, itemsDelta, deltaSummary)
    {
        this.logger.info('[_persistDiff] BEGIN. ', this._currentState);

        return Promise.resolve()
            .then(() => {
                return this._dbAccessor.fetchDiff(this._currentState.snapshot_id,
                    snapshot.date,
                    this._currentState.diff_in_snapshot,
                    deltaSummary)
            })
            .then(dbDiff => {
                this._currentState.diff_id = dbDiff.id;
                this._currentState.diff_date = dbDiff.date;
                this._currentState.diff_in_snapshot = false;
                this._currentState.diff_count += 1;

                this._currentState.diff_item_count += itemsDelta.length;

                var diffSnapshot = new Snapshot();
                for(var x of itemsDelta)
                {
                    var newItem = _.clone(x);
                    diffSnapshot.addItem(newItem);
                }

                return this._dbAccessor.syncDiffItems(dbDiff.id, diffSnapshot);
            })
            .then(() => {
                this.logger.info('[_persistDiff] END.');
            })
    }

    _constructDeltaSummary(snapshot, itemsDelta)
    {
        var deltaSummary = {
            snapshot: this._constructSnapshotSummary(snapshot.getItems()),
            delta: this._constructSnapshotSummary(itemsDelta)
        }

        var currentSnapshotAlerts = {}
        this._constructAlertsSummary(snapshot, currentSnapshotAlerts);

        var alertsDict = _.clone(currentSnapshotAlerts);
        deltaSummary.snapshot.alerts = _.sum(_.values(alertsDict));

        if (this._latestSnapshotAlerts)
        {
            for(var x of _.keys(this._latestSnapshotAlerts))
            {
                if (!alertsDict[x]) {
                    alertsDict[x] = 0;
                }
                alertsDict[x] -= this._latestSnapshotAlerts[x];
            }
        }
        deltaSummary.delta.alerts = _.sum(_.values(alertsDict));

        this._latestSnapshotAlerts = currentSnapshotAlerts;

        return deltaSummary;
    }

    _constructSnapshotSummary(items)
    {
        var dns = {};
        var summary = {
            items: 0,
            kinds: {}
        };

        for(var item of items)
        {
            if (item.config_kind != 'alerts')
            {
                if (!dns[item.dn])
                {
                    dns[item.dn] = true;
                    
                    summary.items = summary.items + 1;

                    if (!summary.kinds[item.kind])
                    {
                        summary.kinds[item.kind] = 1;
                    }
                    else
                    {
                        summary.kinds[item.kind] = summary.kinds[item.kind] + 1;
                    }
                }
            }
        }

        return summary;
    }

    _constructAlertsSummary(snapshot, alertsDict)
    {
        for(var item of snapshot.getItems())
        {
            if (item.config_kind == 'alerts')
            {
                if (_.isNullOrUndefined(alertsDict[item.dn])) {
                    alertsDict[item.dn] = 0;
                }
                alertsDict[item.dn] += item.config.length;
            }
        }
    }

    _produceDelta(targetSnapshot, currentSnapshot)
    {
        this.logger.info("[_produceDelta] target count: %s, current count: %s.",  targetSnapshot.count, currentSnapshot.count);
        var itemsDelta = [];

        for(var key of targetSnapshot.keys)
        {
            var targetItem = targetSnapshot.findById(key);
            var currentItem = currentSnapshot.findById(key);
            currentItem = this._sanitizeSnapshotItem(currentItem);
            var shouldAdd = true;

            if (currentItem)
            {
                if (BufferUtils.areEqual(targetItem.config_hash, currentItem.config_hash))
                {
                    shouldAdd = false;
                }
            }

            if (shouldAdd)
            {
                itemsDelta.push({
                    present: 1,
                    dn: targetItem.dn,
                    kind: targetItem.kind,
                    config_kind: targetItem.config_kind,
                    name: targetItem.name,
                    config: targetItem.config,
                    config_hash: targetItem.config_hash
                });
            }
        }

        for(var key of currentSnapshot.keys)
        {
            var currentItem = currentSnapshot.findById(key);
            if (!targetSnapshot.findById(key))
            {
                currentItem = this._sanitizeSnapshotItem(currentItem);
                currentItem.present = 0;
                itemsDelta.push(currentItem);
            }
        }

        return itemsDelta;
    }

    _sanitizeSnapshotItem(item)
    {
        if (!item) {
            return null;
        }
        var config = {
            dn: item.dn,
            kind: item.kind,
            config_kind: item.config_kind,
            config_hash: item.config_hash
        }
        if (item.name) {
            config.name = item.name;
        }
        return config;
    }

    _persistConfig()
    {
        return Promise.resolve()
            .then(() => this._dbAccessor.updateConfig('STATE', this._currentState));
    }

    _produceSnapshot(state)
    {
        this._logger.info("[_produceSnapshot] date: %s, count: %s", state.date.toISOString(), state.getCount());

        var snapshot = new Snapshot(state.date);
        for(var node of state.getNodes())
        {
            {
                snapshot.addItem({
                    config_kind: 'node',
                    dn: node.dn,
                    kind: node.config.kind,
                    config: node.config
                });
            }
            
            var assets = state.getAssets(node.dn);
            {
                if (_.keys(assets.props).length > 0)
                {
                    for(var props of _.values(assets.props))
                    {
                        snapshot.addItem({
                            config_kind: 'props',
                            dn: node.dn,
                            kind: node.config.kind,
                            name: props.id,
                            config: props
                        });
                    }
                }
                if (assets.alerts.length > 0)
                {
                    snapshot.addItem({
                        config_kind: 'alerts',
                        dn: node.dn,
                        kind: node.config.kind,
                        config: assets.alerts
                    });
                }
            }
        }

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
            .then(() => this._dbAccessor.snapshotReader.reconstructRecentShaphot(true))
            .then(snapshot => {
                this._logger.info("[_onDbConnected] reconstructed snapshot item count: %s",
                    snapshot.count);

                this._latestSnapshot = snapshot;

                this._latestSnapshotAlerts = {};
                this._constructAlertsSummary(snapshot, this._latestSnapshotAlerts);

                this._cleanupSnapshot(snapshot);

                this._logger.info("[_onDbConnected] _latestSnapshotAlerts key count: %s", _.keys(this._latestSnapshotAlerts).length);
                this._logger.silly("[_onDbConnected] this._latestSnapshotAlerts: ", this._latestSnapshotAlerts);

                this.debugObjectLogger.dump("history-initial-latest-snapshot-", this._interation, this._latestSnapshot);
                this.debugObjectLogger.dump("history-initial-latest-snapshot-alerts-", this._interation, this._latestSnapshotAlerts);
            })
            .then(() => {
                return this._dbAccessor.querySnapshot(this._currentState.snapshot_id)
            })
            .then(snapshot => {
                if (!snapshot) {
                    this._resetSnapshotState();
                }
            })
            .then(() => {
                this._isDbReady = true;
                this._logger.info("[_onDbConnected] IS READY");
            })
    }

    markDeletedSnapshot(snapshotId)
    {
        if (this._currentState.snapshot_id == snapshotId)
        {
            this._resetSnapshotState();
        }
    }

    setUsedHashesDict(dict)
    {
        this.logger.info("[setUsedHashesDict] size: %s", _.keys(dict).length);
        this._usedHashesDict = dict;
    }

    _resetSnapshotState()
    {
        this.logger.info('[_resetSnapshotState] ');

        this._currentState.snapshot_id = null;
        this._currentState.snapshot_date = null;
        this._currentState.diff_in_snapshot = true;
        this._currentState.diff_count = 0;
        this._currentState.diff_item_count = 0;
    }

}

module.exports = HistoryProcessor;