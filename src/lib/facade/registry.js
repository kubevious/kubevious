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
        return this._context.tracker.scope("FacadeRegistry::accept", (tracker) => {

            var registryState = null;
            var bundle = null;
            return Promise.resolve()
                .then(() => this._makeState(snapshotInfo, tracker))
                .then(result => {
                    registryState = result;
                })
                .then(() => this._runPreProcessors(registryState, tracker))
                .then(() => this._runRuleEngine(registryState, tracker))
                .then(() => this._runPostProcessors(registryState, tracker))
                .then(() => {
                    return tracker.scope("buildBundle", () => {
                        bundle = registryState.buildBundle();
                    });
                })
                .then(() => {
                    return tracker.scope("acceptBundle", () => {
                        return this._acceptBundle(bundle);
                    });
                })
                .then(() => this._runFinalize(registryState, tracker))
        });
        
    }

    _makeState(snapshotInfo, tracker)
    {
        return tracker.scope("_makeState", () => {
            var registryState = new RegistryState(snapshotInfo)
            return registryState;
        });
    }

    _runPreProcessors(registryState, tracker)
    {
        return tracker.scope("_runPreProcessors", (childTracker) => {
            return this._runProcessors(registryState, 
                [
                    ParserAlertsPreprocessor
                ], 
                childTracker);
            });
    }

    _runPostProcessors(registryState, tracker)
    {
        return tracker.scope("_runPostProcessors", (childTracker) => {
            return this._runProcessors(registryState, 
                [
                    AlertCountProcessor,
                    HierarchyAlertCountProcessor,
                    ChildrenCountProcessor
                ], 
                childTracker);
            });
    }

    _runProcessors(registryState, processors, tracker)
    {
        return Promise.serial(processors, x => {
            return tracker.scope(x.name, () => {
                var processor = new x(this.logger, registryState);
                return processor.execute();
            })
        })
    }

    _runRuleEngine(registryState, tracker)
    {
        return tracker.scope("ruleEngine", (childTracker) => {
            return this._context.ruleProcessor.execute(registryState, childTracker);
        });
    }

    _acceptBundle(bundle)
    {
        {
            var items = [];
            for(var x of bundle.nodes)
            {
                items.push({
                    target: { dn: x.dn },
                    value: _.cloneDeep(x.config),
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
                    value: _.cloneDeep(x.config),
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
                    value: _.cloneDeep(x.config),
                    value_hash: x.config_hash,
                });
            }
            this._context.websocket.updateScope({ kind: 'assets' }, items);
        }
    }

    _runFinalize(registryState, tracker)
    {
        return Promise.resolve()
            .then(() => {
                return tracker.scope("registry-accept", () => {
                    return this._context.registry.accept(registryState);
                });
            })
            .then(() => {
                return tracker.scope("search-accept", () => {
                    return this._context.searchEngine.accept(registryState);
                });
            })
            .then(() => {
                return tracker.scope("history-accept", () => {
                    return this._context.historyProcessor.accept(registryState);
                });
            })
    }

}

module.exports = FacadeRegistry;