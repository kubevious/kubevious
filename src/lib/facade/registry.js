const Promise = require('the-promise');
const _ = require('lodash');
const RegistryState = require('kubevious-helpers').RegistryState;
const ParserAlertsPreprocessor = require('../processing/parser-alerts-preprocessor');
const AlertCountProcessor = require('../processing/alert-count-processor');

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
        var registryState = new RegistryState(snapshotInfo)
        return Promise.resolve()
            .then(() => {
                var processor = new ParserAlertsPreprocessor(this.logger, registryState);
                return processor.execute(registryState);
            })
            .then(() => this._context.ruleProcessor.execute(registryState))
            .then(() => {
                var processor = new AlertCountProcessor(this.logger, registryState);
                return processor.execute(registryState);
            })
            .then(() => {
                this._context.registry.accept(registryState);
                this._context.searchEngine.accept(registryState);
                this._context.historyProcessor.accept(registryState);
                // this._context.dataStore.accept(snapshotInfo);
            })
    }

}

module.exports = FacadeRegistry;