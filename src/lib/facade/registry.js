const Promise = require('the-promise');
const _ = require('lodash');
const Snapshot = require("kubevious-helpers").History.Snapshot;
const RegistryState = require('../registry/state');

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
        // this.logger.info(snapshotInfo);
        var registryState = new RegistryState(snapshotInfo)
        return Promise.resolve()
            .then(() => this._context.ruleProcessor.execute(registryState))
            .then(() => {
                this._context.registry.accept(registryState);
                this._context.searchEngine.accept(registryState);
                this._context.historyProcessor.accept(registryState);
                // this._context.dataStore.accept(snapshotInfo);
            })
    }

}

module.exports = FacadeRegistry;