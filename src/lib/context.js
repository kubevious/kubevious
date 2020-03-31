const Promise = require('the-promise');
const FacadeRegistry = require('./facade/registry');
const SearchEngine = require('./search/engine');
const MySqlDriver = require("kubevious-helpers").MySqlDriver;
const HistoryProcessor = require('./history/processor');
const Collector = require('./collector/collector');
const ClusterLeaderElector = require('./cluster/leader-elector')
const DebugObjectLogger = require('./utils/debug-object-logger');

class Context
{
    constructor(logger)
    {
        this._logger = logger.sublogger("Context");
        this._mysqlDriver = new MySqlDriver(logger);
        this._searchEngine = new SearchEngine(this);
        this._historyProcessor = new HistoryProcessor(this);
        this._collector = new Collector(this);

        this._facadeRegistry = new FacadeRegistry(this);

        this._debugObjectLogger = new DebugObjectLogger(this);

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

    get facadeRegistry() {
        return this._facadeRegistry;
    }

    get searchEngine() {
        return this._searchEngine;
    }

    get historyProcessor() {
        return this._historyProcessor;
    }

    get collector() {
        return this._collector;
    }

    get debugObjectLogger() {
        return this._debugObjectLogger;
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
            .then(() => this._mysqlDriver.connect())
            .then(() => this._runServer())
            .catch(reason => {
                console.log("***** ERROR *****");
                console.log(reason);
                this.logger.error(reason);
                process.exit(1);
            });
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