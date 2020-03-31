const Promise = require('the-promise');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');


class Collector
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("Collector");

        this.logger.info("[constructed] ");

        this._snapshots = {};
        this._diffs = {};

        this._iteration = 0;
    }

    get logger() {
        return this._logger;
    }
    
    newSnapshot(date)
    {
        var id = uuidv4();
        this._snapshots[id] = {
            date: date,
            items: {}
        };

        return {
            id: id
        };
    }

    acceptSnapshotItems(snapshotId, items)
    {
        var snapshotInfo = this._snapshots[snapshotId];
        if (!snapshotInfo) {
            return RESPONSE_NEED_NEW_SNAPSHOT;
        }

        for(var item of items)
        {
            snapshotInfo.items[item.hash] = item.data;
        }

        return {};
    }

    activateSnapshot(snapshotId)
    {
        var snapshotInfo = this._snapshots[snapshotId];
        if (!snapshotInfo) {
            return RESPONSE_NEED_NEW_SNAPSHOT;
        }

        this._acceptSnapshot(snapshotInfo);

        return {};
    }

    newDiff(snapshotId, date)
    {
        var snapshotInfo = this._snapshots[snapshotId];
        if (!snapshotInfo) {
            return RESPONSE_NEED_NEW_SNAPSHOT;
        }

        var id = uuidv4();
        this._diffs[id] = {
            date: date,
            snapshotId: snapshotId,
            items: []
        };

        return {
            id: id
        };
    }

    acceptDiffItems(diffId, items)
    {
        var diffInfo = this._diffs[diffId];
        if (!diffInfo) {
            return RESPONSE_NEED_NEW_SNAPSHOT;
        }

        for(var item of items)
        {
            diffInfo.items.push(item);
        }

        return {};
    }

    activateDiff(diffId)
    {
        var diffInfo = this._diffs[diffId];
        if (!diffInfo) {
            return RESPONSE_NEED_NEW_SNAPSHOT;
        }

        var snapshotInfo = this._snapshots[diffInfo.snapshotId];
        if (!snapshotInfo) {
            return RESPONSE_NEED_NEW_SNAPSHOT;
        }

        var newSnapshotId = uuidv4();
        var newSnapshotInfo = {
            date: diffInfo.date,
            items: _.clone(snapshotInfo.items)
        };
        this._snapshots[newSnapshotId] = newSnapshotInfo;

        for(var diffItem of diffInfo.items)
        {
            if (diffItem.present)
            {
                newSnapshotInfo.items[diffItem.hash] = diffItem.data;
            }
            else
            {
                delete newSnapshotInfo.items[diffItem.hash];
            }
        }

        delete this._snapshots[diffInfo.snapshotId];

        this._acceptSnapshot(newSnapshotInfo);

        return {
            id: newSnapshotId
        };
    }

    _acceptSnapshot(snapshotInfo)
    {
        this.logger.info("[_acceptSnapshot] item count: %s", _.keys(snapshotInfo.items).length);
        // for(var item of _.values(snapshotInfo.items))
        // {
        //     this.logger.info("[_acceptSnapshot] %s", item.dn);
        // }

        this._iteration++;
        this._context.debugObjectLogger.dump('collector-snapshot-info-', this._iteration, snapshotInfo);
    }

}

const RESPONSE_NEED_NEW_SNAPSHOT = {
    new_snapshot: true
};

module.exports = Collector;