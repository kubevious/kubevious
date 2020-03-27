const Promise = require('the-promise');
const K8sParser = require('./parsers/k8s');
const ConcreteRegistry = require('./concrete/registry');
const FacadeRegistry = require('./facade/registry');
const LogicProcessor = require('./logic/processor');
const SearchEngine = require('./search/engine');
const MySqlDriver = require("kubevious-helpers").MySqlDriver;
const HistoryProcessor = require('./history/processor');
const ClusterLeaderElector = require('./cluster/leader-elector')
const DebugObjectLogger = require('./utils/debug-object-logger');

class Context
{
    constructor(logger)
    {
        this._logger = logger.sublogger("Context");
        this._loaders = [];
        this._mysqlDriver = new MySqlDriver(logger);
        this._concreteRegistry = new ConcreteRegistry(this);
        this._k8sParser = new K8sParser(this);
        this._searchEngine = new SearchEngine(this);
        this._historyProcessor = new HistoryProcessor(this);
        this._logicProcessor = new LogicProcessor(this);

        this._facadeRegistry = new FacadeRegistry(this);

        this._debugObjectLogger = new DebugObjectLogger(this);

        this._areLoadersReady = false;

        this._server = null;
        this._k8sClient = null;
        this._clusterLeaderElector = null;
    }

    get logger() {
        return this._logger;
    }

    get mysqlDriver() {
        return this._mysqlDriver;
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

    get searchEngine() {
        return this._searchEngine;
    }

    get historyProcessor() {
        return this._historyProcessor;
    }

    get logicProcessor() {
        return this._logicProcessor;
    }

    get areLoadersReady() {
        return this._areLoadersReady;
    }

    get debugObjectLogger() {
        return this._debugObjectLogger;
    }

    addLoader(loader)
    {
        var loaderInfo = {
            loader: loader,
            isReady: false,
            readyHandler: (value) => {
                loaderInfo.isReady = value;
                this._logger.debug("[readyHandler] %s", value);
                this._checkLoadersReady();
            }
        }
        loader.setupReadyHandler(loaderInfo.readyHandler);
        this._loaders.push(loaderInfo);
    }

    setupServer()
    {
        const Server = require("./server");
        this._server = new Server(this);
    }

    setupK8sClient(client)
    {
        this._k8sClient = client;
        if (this._k8sClient) 
        {
            this._clusterLeaderElector = new ClusterLeaderElector(this, this._k8sClient);
        }
    }

    run()
    {
        return Promise.resolve()
            .then(() => this._processLoaders())
            .then(() => this._mysqlDriver.connect())
            .then(() => this._runServer())
            .catch(reason => {
                console.log("***** ERROR *****");
                console.log(reason);
                this.logger.error(reason);
                process.exit(1);
            });
    }

    _processLoaders()
    {
        return Promise.serial(this._loaders, x => {
            return x.loader.run();
        });
    }

    _checkLoadersReady()
    {
        var areLoadersReady = this._calculateLoadersReady();
        if (areLoadersReady != this._areLoadersReady) {
            this._areLoadersReady = areLoadersReady;
            this.logger.info("[_checkLoadersReady] areLoadersReady: %s", areLoadersReady);

            if (this._areLoadersReady)
            {
                this.facadeRegistry.handleAreLoadersReadyChange();
            }
        }
    }

    _calculateLoadersReady()
    {
        for(var loader of this._loaders)
        {
            if (!loader.isReady) {
                return false;
            }
        }
        return true;
    }

    _runServer()
    {
        if (!this._server) {
            return;
        }

        this._server.run()
    }
}

module.exports = Context;