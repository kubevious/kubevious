const Promise = require('the-promise');
const _ = require('lodash');

class Collector
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("Collector");

        this.logger.info("[constructed] ")
    }

    get logger() {
        return this._logger;
    }
    
    newSnapshot(date)
    {
        return {
            id: "snap-aaa"
        };
    }

    acceptSnapshotItems(snapshotId, items)
    {
        return {};
    }

    activateSnapshot(snapshotId)
    {
        return {};
    }

    newDiff(snapshotId, date)
    {
        return {
            id: "diff-ccc"
        };
    }

    acceptDiffItems(diffId, items)
    {
        return {};
    }

    activateDiff(diffId)
    {
        return {
            id: "snap-bbb"
        };
    }

}

module.exports = Collector;