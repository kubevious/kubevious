const Promise = require('the-promise');
const _ = require('the-lodash');

class HistorySnapshotWriter
{
    constructor(logger, db)
    {
        this._logger = logger.sublogger('HistorySnapshotWriter');
        this._db = db;
    }

    get logger() {
        return this._logger;
    }

}



module.exports = HistorySnapshotWriter;