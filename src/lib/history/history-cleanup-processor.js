const _ = require('the-lodash');
const HistoryAccessor = require("./db-accessor");

class HistoryCleanupProcessor {
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('HistoryCleanupProcessor');
        this._dbAccessor = new HistoryAccessor(context, context.database);
        this._days = 14

        context.database.onConnect(this._onDbConnected.bind(this));
    }

    _onDbConnected()
    {
        this._logger.info("[_onDbConnected] ...");
        this._latestSnapshot = null;
    }

    cleanDb()
    {
        const snapDate = [new Date(Date.now() - this._days * 24 * 60 * 60 * 1000)]

        Promise.resolve()
            .then(() => this._dbAccessor.fetchCleanedSnapshots(snapDate))
            .then(snapshotIds => {
                return this._dbAccessor.deleteDiffs(snapshotIds)
                    .then(() => snapshotIds)
            })
            .then(snapshotIds => this._dbAccessor.deleteSnapshotItems(snapshotIds))

    }

}

module.exports = HistoryCleanupProcessor
