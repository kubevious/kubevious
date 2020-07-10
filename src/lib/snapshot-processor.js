const Promise = require('the-promise');
const _ = require('lodash');
const fs = require("fs");
const Path = require("path");

const RegistryState = require('kubevious-helpers').RegistryState;

class SnapshotProcessor
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger('SnapshotProcessor');

        this._processors = [];
        this._extractProcessors();
    }

    get logger() {
        return this._logger;
    }

    _extractProcessors()
    {
        this.logger.info('[_extractProcessors] ');
        var location = 'snapshot-processors';
        var files = fs.readdirSync(Path.join(__dirname, location));
        files = _.filter(files, x => x.endsWith('.js'));

        for(var x of files)
        {
            const pa = './' + location + '/' + x;
            const procModule = require(pa);

            this._processors.push({
                name: Path.parse(x).name,
                order: procModule.order,
                handler: procModule.handler
            });
        }
        this._processors = _.orderBy(this._processors, x => x.order);

        for(var processor of this._processors)
        {
            this._logger.info("[_extractProcessors] HANDLER: %s :: %s", 
                processor.order, 
                processor.name)
        }
    }

    process(snapshotInfo, tracker)
    {
        if (!tracker) {
            tracker = this._context.tracker;
        }

        return tracker.scope("SnapshotProcessor::process", (tracker) => {

            var registryState = null;
            var bundle = null;
            return Promise.resolve()
                .then(() => this._makeState(snapshotInfo, tracker))
                .then(result => {
                    registryState = result;
                })
                .then(() => this._runProcessors(registryState, tracker))
                .then(() => {
                    return tracker.scope("buildBundle", () => {
                        bundle = registryState.buildBundle();
                    });
                })
                .then(() => {
                    return {
                        registryState: registryState,
                        bundle: bundle
                    }
                })
        });
    }

    _makeState(snapshotInfo, tracker)
    {
        return tracker.scope("_makeState", () => {
            var registryState = new RegistryState(snapshotInfo)
            return registryState;
        });
    }

    _runProcessors(registryState, tracker)
    {
        return tracker.scope("handlers", (procTracker) => {
            return Promise.serial(this._processors, processor => {
                return procTracker.scope(processor.name, (innerTracker) => {

                    var params = {
                        logger: this.logger,
                        context: this._context,
                        state: registryState,
                        tracker: innerTracker
                    }
                    
                    return processor.handler(params);
                })
            })
        });
    }

}

module.exports = SnapshotProcessor;