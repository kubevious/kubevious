const express = require('express');
const PromiseRouter = require('express-promise-router');
const Promise = require("the-promise");
const morgan = require('morgan')

class Server
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("Server");
        this._app = express();
        this._httpServer = null;
    }

    get logger() {
        return this._logger;
    }

    get httpServer() {
        return this._httpServer;
    }

    run()
    {
        if (process.env.NODE_ENV == 'development')
        {
            this._app.use(morgan('tiny'))
        }

        this._app.use(express.json({limit: '10mb'}));

        this._loadRouter('top');
        this._loadRouter('api');
        this._loadRouter('collector');
        this._loadRouter('history');
        this._loadRouter('rule');
        this._loadRouter('marker');

        const port = 4001;
        this._httpServer = this._app.listen(port, () => {
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
            websocket: this._context.websocket,
            context: this._context,
            collector: this._context.collector,
            history: this._context.historySnapshotReader
        }
        
        const module = require('./routers/' + name)
        module(routerContext);
    }
}

module.exports = Server;
