const express = require('express');
const PromiseRouter = require('express-promise-router');
const Promise = require("the-promise");

class Server
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("Server");
        this._app = express();
    }

    get logger() {
        return this._logger;
    }

    run()
    {
        this._app.use(express.json({limit: '10mb'}));

        this._loadRouter('top');
        this._loadRouter('api');
        this._loadRouter('collector');

        const port = 4000;
        this._app.listen(port, () => {
            this.logger.info("listening on port %s", port);
        });
    }

    _loadRouter(name)
    {
        this.logger.info("Loading router %s...", name);

        const router = PromiseRouter();

        var routerContext = {
            logger: this.logger.sublogger(name),
            router,
            app: this._app,
            context: this._context,
            collector: this._context.collector
        }
        
        const module = require('./routers/' + name)
        module(routerContext);
    }
}

module.exports = Server;