const Promise = require('the-promise');
const ProcessingTracker = require("kubevious-helpers").ProcessingTracker;
const FacadeRegistry = require('./facade/registry');
const SearchEngine = require('./search/engine');
const Database = require('./db');
const HistoryProcessor = require('./history/processor');
const Registry = require('./registry/registry');
const Collector = require('./collector/collector');
const ClusterLeaderElector = require('./cluster/leader-elector')
const DebugObjectLogger = require('./utils/debug-object-logger');
const MarkerAccessor = require('./rule/marker-accessor')
const MarkerCache = require('./rule/marker-cache')
const RuleAccessor = require('./rule/rule-accessor')
const RuleCache = require('./rule/rule-cache')
const RuleProcessor = require('./rule/rule-processor')
const HistorySnapshotReader = require("kubevious-helpers").History.SnapshotReader;
const WebSocketServer = require('./websocket/server');
const SnapshotProcessor = require('./snapshot-processor');

const SERVER_PORT = 4001;

class Context
{
    constructor(logger)
    {
        this._logger = logger.sublogger("Context");
        this._tracker = new ProcessingTracker(logger.sublogger("Tracker"));
        this._database = new Database(logger);
        this._searchEngine = new SearchEngine(this);
        this._historyProcessor = new HistoryProcessor(this);
        this._collector = new Collector(this);
        this._registry = new Registry(this);

        this._facadeRegistry = new FacadeRegistry(this);

        this._debugObjectLogger = new DebugObjectLogger(this);

        this._markerAccessor = new MarkerAccessor(this, this.database.dataStore);
        this._markerCache = new MarkerCache(this);
        this._ruleAccessor = new RuleAccessor(this, this.database.dataStore);
        this._ruleCache = new RuleCache(this);
        this._ruleProcessor = new RuleProcessor(this, this.database.dataStore);

        this._historySnapshotReader = new HistorySnapshotReader(logger, this._database.driver);

        this._websocket = new WebSocketServer(this);

        this._snapshotProcessor = new SnapshotProcessor(this);

        this._server = null;
        this._k8sClient = null;
        this._clusterLeaderElector = null;
    }

    get logger() {
        return this._logger;
    }

    get tracker() {
        return this._tracker;
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

    get collector() {
        return this._collector;
    }

    get registry() {
        return this._registry;
    }

    get debugObjectLogger() {
        return this._debugObjectLogger;
    }

    get markerAccessor() {
        return this._markerAccessor;
    }

    get markerCache() {
        return this._markerCache;
    }

    get ruleAccessor() {
        return this._ruleAccessor;
    }

    get ruleCache() {
        return this._ruleCache;
    }

    get ruleProcessor() {
        return this._ruleProcessor;
    }

    get historySnapshotReader() {
        return this._historySnapshotReader;
    }

    get websocket() {
        return this._websocket;
    }

    get snapshotProcessor() {
        return this._snapshotProcessor;
    }

    setupServer()
    {
        const Server = require("./server");
        this._server = new Server(this, SERVER_PORT);
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
        if (process.env.NODE_ENV == 'development')
        {
            this.tracker.enablePeriodicDebugOutput(5);
        }
        else
        {
            this.tracker.enablePeriodicDebugOutput(10);
        }

        return Promise.resolve()
            .then(() => this._database.init())
            .then(() => this._runServer())
            .then(() => this._setupWebSocket())
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

    _setupWebSocket()
    {
        this._websocket.run(this._server.httpServer);
    }
}

module.exports = Context;
