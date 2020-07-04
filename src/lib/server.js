const express = require('express');
const Promise = require("the-promise");
const morgan = require('morgan')
const fs = require('fs')
const Path = require('path');

class Server
{
    constructor(context, port)
    {
        this._port = port;
        this._context = context;
        this._logger = context.logger.sublogger("Server");
        this._app = express();
        this._httpServer = null;
        this._isDev = (process.env.NODE_ENV === 'development');
    }

    get logger() {
        return this._logger;
    }

    get httpServer() {
        return this._httpServer;
    }

    run()
    {
        if (this._isDev)
        {
            this._app.use(morgan('tiny'))
        }

        this._app.use(express.json({limit: '10mb'}));

        this._loadRouters();

        this._app.use((req, res, next) => {
            res.status(404).json({
                status: 404,
                message: 'Not Found'
            });
        });

        this._app.use((error, req, res, next) => {
            var status = 500
            res.status(status).json({
                status: status,
                message: error.message || 'Internal Server Error',
                stack: this._isDev ? error.stack : ''
            });
        });

        this._httpServer = this._app.listen(this._port, () => {
            this.logger.info("listening on port %s", this._port);
        });
    }

    _loadRouters()
    {
        var routerNames = fs.readdirSync(Path.join(__dirname, 'routers'));
        routerNames = routerNames.map(x => Path.parse(x).name);
        for(var x of routerNames)
        {
            this._loadRouter(x);
        }
    }

    _loadRouter(name)
    {
        this.logger.info("Loading router %s...", name);
        const routerModule = require('./routers/' + name)

        const router = express.Router();

        const wrappedRouter = {
            get: (url, handler) => {
                router.get(url, (req, res) => {
                    this._handleRoute(req, res, handler)
                })
            },

            post: (url, handler) => {
                router.post(url, (req, res) => {
                    this._handleRoute(req, res, handler)
                })
            },

            put: (url, handler) => {
                router.put(url, (req, res) => {
                    this._handleRoute(req, res, handler)
                })
            },

            delete: (url, handler) => {
                router.delete(url, (req, res) => {
                    this._handleRoute(req, res, handler)
                })
            },
        }

        var routerContext = {
            logger: this.logger.sublogger("Router" + name),
            router: wrappedRouter,
            app: this._app,
            websocket: this._context.websocket,
            context: this._context,
            collector: this._context.collector,
            history: this._context.historySnapshotReader,
            reportError: (statusCode, message) => {
                throw new RouterError(message, statusCode);
            },
            reportUserError: (message) => {
                throw new RouterError(message, 400);
            }
        }

        routerModule.setup(routerContext);
        
        this._app.use(routerModule.url, router);
    }

    _handleRoute(req, res, handler)
    {
        try
        {
            var result = handler(req, res);
            Promise.resolve(result)
                .then(result => {
                    res.json(result)
                }) 
                .catch((reason) => {
                    this._handleError(res, reason);
                });
        }
        catch(reason)
        {
            this._handleError(res, reason);
        }
    }

    _handleError(res, reason)
    {
        if (reason instanceof RouterError) {
            if (this._isDev) {
                res.status(reason.statusCode).json({ message: reason.message, stack: reason.stack });
            } else {
                res.status(reason.statusCode).json({ message: reason.message });
            }
        } else {
            var status = 500;
            if (this._isDev) {
                res.status(status).json({ message: reason.message, stack: reason.stack })
            } else {
                res.status(status).json({ message: reason.message })
            }
        }
    }
}

class RouterError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.statusCode = statusCode;
    }
}

module.exports = Server;
