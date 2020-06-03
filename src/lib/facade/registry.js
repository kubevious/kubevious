const Promise = require('the-promise');
const _ = require('lodash');
const RegistryState = require('kubevious-helpers').RegistryState;
const ParserAlertsPreprocessor = require('../processing/parser-alerts-preprocessor');
const AlertCountProcessor = require('../processing/alert-count-processor');
const HierarchyAlertCountProcessor = require('../processing/hierarchy-alert-count-processor');
const ChildrenCountProcessor = require('../processing/children-count-processor');

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
                return processor.execute();
            })
            .then(() => this._context.ruleProcessor.execute(registryState))
            .then(() => {
                var processor = new AlertCountProcessor(this.logger, registryState);
                return processor.execute();
            })
            .then(() => {
                var processor = new HierarchyAlertCountProcessor(this.logger, registryState);
                return processor.execute();
            })
            .then(() => {
                var processor = new ChildrenCountProcessor(this.logger, registryState);
                return processor.execute();
            })
            .then(() => {
                var bundle = registryState.buildBundle();
                this._acceptBundle(bundle);

                this._context.registry.accept(registryState);
                this._context.searchEngine.accept(registryState);
                this._context.historyProcessor.accept(registryState);
                // this._context.dataStore.accept(snapshotInfo);
            })
    }

    _acceptBundle(bundle)
    {
        {
            var items = [];
            for(var x of bundle.nodes)
            {
                items.push({
                    target: { dn: x.dn },
                    value: x.config,
                    value_hash: x.config_hash,
                });
            }
            this._context.websocket.updateScope({ kind: 'node' }, items);
        }

        {
            var items = [];
            for(var x of bundle.children)
            {
                items.push({
                    target: { dn: x.dn },
                    value: x.config,
                    value_hash: x.config_hash,
                });
            }
            this._context.websocket.updateScope({ kind: 'children' }, items);
        }

        {
            var items = [];
            for(var x of bundle.assets)
            {
                items.push({
                    target: { dn: x.dn },
                    value: x.config,
                    value_hash: x.config_hash,
                });
            }
            this._context.websocket.updateScope({ kind: 'assets' }, items);
        }
    }

}

module.exports = FacadeRegistry;