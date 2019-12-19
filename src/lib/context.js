const Promise = require('the-promise');
const K8sParser = require('./parsers/k8s');
const ConcreteRegistry = require('./concrete/registry');
const FacadeRegistry = require('./facade/registry');
const LogicProcessor = require('./logic/processor');

class Context
{
    constructor(logger)
    {
        this._logger = logger.sublogger("Context");
        this._loaders = [];
        this._facadeRegistry = new FacadeRegistry(this);
        this._concreteRegistry = new ConcreteRegistry(this);
        this._k8sParser = new K8sParser(this);

        this._logicProcessor = new LogicProcessor(this);
    }

    get logger() {
        return this._logger;
    }

    get concreteRegistry() {
        return this._concreteRegistry;
    }

    get facadeRegistry() {
        return this._facadeRegistry;
    }

    get k8sParser() {
        return this._k8sParser;
    }

    addGKELoader(credentials, name, region)
    {
        const Loader = require('./loaders/gke');
        var loader = new Loader(this,
            credentials,
            name,
            region);
        this.addLoader(loader);
    }

    addLoader(loader)
    {
        this._loaders.push(loader);
    }

    run()
    {
        return Promise.resolve()
            .then(() => this._setupParsers())
            .then(() => this._processLoaders())
    }

    _processLoaders()
    {
        return Promise.serial(this._loaders, x => {
            return x.run();
        });
    }

    _setupParsers()
    {

    }
}

module.exports = Context;