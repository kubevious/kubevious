const _ = require("the-lodash");
const fs = require("fs");
const path = require("path");
const Scope = require("./scope");

class LogicProcessor 
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("LogicProcessor");

        this._parsers = [];
        this._extractParsers();

        this._polishers = [];
        this._extractPolishers();

        this._context.concreteRegistry.onChanged(this._process.bind(this));
    }

    get logger() {
        return this._logger;
    }

    _extractParsers()
    {
        this.logger.info('[_extractParsers] ...');
        var files = fs.readdirSync(path.join(__dirname, "parsers"));
        files = _.filter(files, x => x.endsWith('.js'));
        for(var x of files)
        {
            this.logger.info('[_extractParsers] %s', x);
            this._loadParser(x);
        }

        this._parsers = _.orderBy(this._parsers, [
            x => x.order,
            x => _.stableStringify(x.target)
        ]);

        for(var handlerInfo of this._parsers)
        {
            this._logger.info("[_extractParsers] HANDLER: %s -> %s, target:", 
                handlerInfo.order, 
                handlerInfo.name, 
                handlerInfo.target)
        }
    }

    _loadParser(name)
    {
        this.logger.info('[_loadParser] %s...', name);
        const handler = require('./parsers/' + name);

        var targets = null;
        if (handler.target) {
            targets = [handler.target];
        } else if (handler.targets) {
            targets = handler.targets;
        }

        var order = 0;
        if (handler.order) {
            order = handler.order;
        }

        for(var target of targets)
        {
            this.logger.info('[_loadParser] Adding %s...', name, target);

            var info = {
                name: name,
                kind: handler.kind,
                order: order,
                target: target,
                handler: handler.handler
            }
            this._parsers.push(info);
        }
    }

    _extractPolishers()
    {
        this.logger.info('[_extractPolishers] ...');
        var files = fs.readdirSync(path.join(__dirname, "polishers"));
        files = _.filter(files, x => x.endsWith('.js'));
        for(var x of files)
        {
            this.logger.info('[_extractPolishers] %s', x);
            this._loadPolisher(x);
        }

        this._parsers = _.orderBy(this._parsers, [
            x => x.order,
            x => _.stableStringify(x.target)
        ]);

        for(var handlerInfo of this._parsers)
        {
            this._logger.info("[_extractPolishers] HANDLER: %s -> %s, target:", 
                handlerInfo.order, 
                handlerInfo.name, 
                handlerInfo.target)
        }
    }

    _loadPolisher(name)
    {
        this.logger.info('[_loadPolisher] %s...', name);
        const handler = require('./polishers/' + name);

        var targets = null;
        if (handler.target) {
            targets = [handler.target];
        } else if (handler.targets) {
            targets = handler.targets;
        }

        var order = 0;
        if (handler.order) {
            order = handler.order;
        }

        for(var target of targets)
        {
            this.logger.info('[_loadPolisher] Adding %s...', name, target);

            var info = {
                name: name,
                kind: handler.kind,
                order: order,
                target: target,
                handler: handler.handler
            }
            this._polishers.push(info);
        }
    }

    _process()
    {
        this._logger.info("[_proces] BEGIN");

        var scope = new Scope(this._context);

        this._processParsers(scope);
        this._processPolishers(scope);

        this._logger.info("[_proces] READY");

        this._context.facadeRegistry.acceptItems(scope.extractItems());
        this._context.facadeRegistry.updateLogicTree(scope.root.exportTree());
        this._context.facadeRegistry.updateConfigTree(scope.configMap);

        this._logger.info("[_proces] END");

        return this._dumpToFile(scope);
    }

    _processParsers(scope)
    {
        for(var handlerInfo of this._parsers)
        {
            this._processParser(scope, handlerInfo);
        }
    }

    _processParser(scope, handlerInfo)
    {
        this._logger.debug("[_processParser] Handler: %s -> %s, target:", 
            handlerInfo.order, 
            handlerInfo.name, 
            handlerInfo.target);

        var items = this._context.concreteRegistry.filterItems(handlerInfo.target);
        for(var item of items)
        {
            this._processHandler(scope, handlerInfo, item.id, item);
        }
    }

    _processHandler(scope, handlerInfo, id, item)
    {
        this._logger.silly("[_processHandler] Handler: %s, Item: %s", 
            handlerInfo.name, 
            id);

        var handlerArgs = {
            scope: scope,
            logger: this.logger,
            item: item,
            context: this.context,

            createdItems: [],
            createdAlerts: []
        }

        handlerArgs.hasCreatedItems = () => {
            return handlerArgs.createdItems.length > 0;
        }

        handlerArgs.createItem = (parent, name, params) => {
            if (!handlerInfo.kind) {
                throw new Error("Missing handler kind.")
            }
            params = params || {};
            var newObj = parent.fetchByNaming(handlerInfo.kind, name);
            if (params.order) {
                newObj.order = params.order;
            }
            handlerArgs.createdItems.push(newObj);
            return newObj;
        }

        handlerArgs.createK8sItem = (parent, params) => {
            params = params || {};
            var name = params.name || item.config.metadata.name;
            var newObj = handlerArgs.createItem(parent, name, params);
            scope.setK8sConfig(newObj, item.config);
            return newObj;
        }

        handlerArgs.createAlert = (kind, severity, date, msg) => {
            handlerArgs.createdAlerts.push({
                kind,
                severity,
                date,
                msg
            });
        }

        handlerInfo.handler(handlerArgs);

        for(var alertInfo of handlerArgs.createdAlerts)
        {
            for(var createdItem of handlerArgs.createdItems)
            {
                createdItem.addAlert(
                    alertInfo.kind, 
                    alertInfo.severity, 
                    alertInfo.date, 
                    alertInfo.msg);
            }
        }
    }

    _processPolishers(scope)
    {
        for(var handlerInfo of this._polishers)
        {
            this._processPolisher(scope, handlerInfo);
        }
    }

    _processPolisher(scope, handlerInfo)
    {
        this._logger.info("[_processPolisher] Handler: %s -> %s, target:", 
            handlerInfo.order, 
            handlerInfo.name, 
            handlerInfo.target);

        var path = _.clone(handlerInfo.target.path);
        this._visitTree(scope.root, path, item => {
            this._logger.info("[_processPolisher] Visited: %s", item.dn);
            this._processHandler(scope, handlerInfo, item.dn, item);
        });
    }

    _processPolisherItem(scope, handlerInfo, item)
    {
        this._logger.info("[_processPolisherItem] Handler: %s, Item: %s", 
            handlerInfo.name, 
            item.dn);

    }

    _visitTree(item, path, cb)
    {
        this._logger.silly("[_visitTree] %s, path: %s...", item.dn, path);

        if (path.length == 0)
        {
            cb(item);
        }
        else
        {
            var top = _.head(path);
            path.shift();
            var children = item.getChildrenByKind(top);
            for(var child of children)
            {
                this._visitTree(child, path, cb);
            }
        }
    }

    _dumpToFile(scope)
    {
        return Promise.resolve()
            .then(() => {
                var writer = this.logger.outputStream("dump-logic-tree");
                if (writer) {
                    scope.root.debugOutputToFile(writer);
                    return writer.close();
                }
            })
            .then(() => {
                var writer = this.logger.outputStream("dump-logic-tree-detailed");
                if (writer) {
                    scope.root.debugOutputToFile(writer, { includeConfig: true });
                    return writer.close();
                }
            })
            .then(() => {
                var writer = this.logger.outputStream("exported-tree");
                if (writer) {
                    writer.write(this._context.facadeRegistry.logicTree);
                    return writer.close();
                }
            });
    }


}

module.exports = LogicProcessor;