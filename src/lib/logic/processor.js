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

        this._handlers = [];
        this._extractHandlers();

        this._context.concreteRegistry.onChanged(this._process.bind(this));
    }

    get logger() {
        return this._logger;
    }

    _extractHandlers()
    {
        this.logger.info('[_extractHandlers] ...');
        var files = fs.readdirSync(path.join(__dirname, "handlers"));
        files = _.filter(files, x => x.endsWith('.js'));
        for(var x of files)
        {
            this.logger.info('[_extractHandlers] %s', x);
            this._loadHandler(x);
        }

        this._handlers = _.orderBy(this._handlers, [
            x => x.order,
            x => _.stableStringify(x.target)
        ]);

        for(var handlerInfo of this._handlers)
        {
            this._logger.info("[_extractHandlers] HANDLER: %s -> %s, target:", 
                handlerInfo.order, 
                handlerInfo.name, 
                handlerInfo.target)
        }
    }

    _loadHandler(name)
    {
        this.logger.info('[_loadHandler] %s...', name);
        const handler = require('./handlers/' + name);

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
            this.logger.info('[_loadHandler] Adding %s...', name, target);

            var info = {
                name: name,
                order: order,
                target: target,
                handler: handler.handler
            }
            this._handlers.push(info);
        }
    }

    _process()
    {
        this._logger.info("[_proces] BEGIN");

        var scope = new Scope(this._context);

        this._processHandlers(scope);

        this._logger.info("[_proces] READY");

        this._context.facadeRegistry.acceptItems(scope.extractItems());
        this._context.facadeRegistry.updateLogicTree(scope.root.exportTree());
        this._context.facadeRegistry.updateConfigTree(scope.configMap);

        this._logger.info("[_proces] END");

       return this._dumpToFile(scope);
    }

    _processHandlers(scope)
    {
        for(var handlerInfo of this._handlers)
        {
            this._logger.verbose("[_extractHandlers] HANDLER: %s, target:", 
                handlerInfo.name, 
                handlerInfo.target);
            this._processHandler(scope, handlerInfo);
        }
    }

    _processHandler(scope, handlerInfo)
    {
        this._logger.debug("[_processHandler] Handler: %s -> %s, target:", 
            handlerInfo.order, 
            handlerInfo.name, 
            handlerInfo.target);

        var items = this._context.concreteRegistry.filterItems(handlerInfo.target);
        for(var item of items)
        {
            this._processHandlerItem(scope, handlerInfo, item);
        }
    }

    _processHandlerItem(scope, handlerInfo, item)
    {
        this._logger.silly("[_processHandlerItem] Handler: %s, Item: ", 
            handlerInfo.name, 
            item.id);

        var handlerArgs = {
            scope: scope,
            logger: this.logger,
            item: item,
            context: this.context
        }
        handlerInfo.handler(handlerArgs);
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