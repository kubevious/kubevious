const Promise = require('the-promise');
const FacadeRegistry = require('./facade/registry');
const SearchEngine = require('./search/engine');
const Database = require('./db');
const HistoryProcessor = require('./history/processor');
const DataStore = require('./store/data-store');
const Registry = require('./registry/registry');
const Collector = require('./collector/collector');
const ClusterLeaderElector = require('./cluster/leader-elector')
const DebugObjectLogger = require('./utils/debug-object-logger');
const RuleAccessor = require('./rule/rule-accessor')
const RuleProcessor = require('./rule/rule-processor')
const HistorySnapshotReader = require("kubevious-helpers").History.SnapshotReader;

class Context
{
    constructor(logger)
    {
        this._logger = logger.sublogger("Context");
        this._database = new Database(logger);
        this._searchEngine = new SearchEngine(this);
        this._historyProcessor = new HistoryProcessor(this);
        this._dataStore = new DataStore(this);
        this._collector = new Collector(this);
        this._registry = new Registry(this);

        this._facadeRegistry = new FacadeRegistry(this);

        this._debugObjectLogger = new DebugObjectLogger(this);

        this._ruleAccessor = new RuleAccessor(this);
        this._ruleProcessor = new RuleProcessor(this);

        this._historySnapshotReader = new HistorySnapshotReader(logger, this._database.driver);

        this._server = null;
        this._k8sClient = null;
        this._clusterLeaderElector = null;
    }

    get logger() {
        return this._logger;
    }

    get mysqlDriver() {
        return this.database.driver;
    }

    get database() {
        return this._database;
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

    get dataStore() {
        return this._dataStore;
    }

    get collector() {
        return this._collector;
    }

    get registry() {
        return this._registry;
    }

    get debugObjectLogger() {
        return this._debugObjectLogger;
    }

    get ruleAccessor() {
        return this._ruleAccessor;
    }

    get ruleProcessor() {
        return this._ruleProcessor;
    }

    get historySnapshotReader() {
        return this._historySnapshotReader;
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
            .then(() => this._database.init())
            .then(() => this._dataStore.init())
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
