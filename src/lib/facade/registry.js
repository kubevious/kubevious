const Promise = require('the-promise');
const _ = require('lodash');

class FacadeRegistry
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("FacadeRegistry");

        this._configMap = {};
    }

    get logger() {
        return this._logger;
    }

    acceptCurrentSnapshot(snapshotInfo)
    {
        this._context.registry.accept(snapshotInfo);
        this._context.searchEngine.accept(snapshotInfo);
        this._context.historyProcessor.accept(snapshotInfo);
        this._context.dataStore.accept(snapshotInfo);
    }
}

module.exports = FacadeRegistry;