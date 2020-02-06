const Promise = require('the-promise');
const K8sParser = require('./parsers/k8s');
const ConcreteRegistry = require('./concrete/registry');
const FacadeRegistry = require('./facade/registry');
const LogicProcessor = require('./logic/processor');
const SearchEngine = require('./search/engine');
const MysqlDriver = require("./utils/mysql-driver");
const HistoryProcessor = require('./history/processor');

class Context
{
    constructor(logger)
    {
        this._logger = logger.sublogger("Context");
        this._loaders = [];
        this._mysqlDriver = new MysqlDriver(logger);
        this._facadeRegistry = new FacadeRegistry(this);
        this._concreteRegistry = new ConcreteRegistry(this);
        this._k8sParser = new K8sParser(this);
        this._searchEngine = new SearchEngine(this);
        this._historyProcessor = new HistoryProcessor(this);

        this._logicProcessor = new LogicProcessor(this);


        this._server = null;
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

    addLoader(loader)
    {
        this._loaders.push(loader);
    }

    setupServer()
    {
        const Server = require("./server");
        this._server = new Server(this);
    }

    run()
    {
        return Promise.resolve()
            .then(() => this._setupParsers())
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
            return x.run();
        });
    }

    _setupParsers()
    {

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