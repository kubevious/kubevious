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

        //     this._context.historyProcessor.acceptSnapshot(value);

        //     this._context.searchEngine.reset();
        //     for(var item of _.values(this._itemsMap))
        //     {
        //         this._context.searchEngine.addToIndex(item);
        //     }
    }
}

module.exports = FacadeRegistry;