const express = require('express');
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
        if (process.env.NODE_ENV === 'development')
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

        this._app.use((req, res, next) => {
            const reason = {
                reason: new Error('Not found'),
                status: 400,
            }

            next(reason);
        });

        this._app.use((error, req, res, next) => {
            res.status(error.status || 400).json({
                status: error.status || 500,
                message: error.reason.message || 'Internal Server Error',
                stack: process.env.NODE_ENV === 'development' ? error.reason.stack : ''
            });

        });

        const port = 4001;
        this._httpServer = this._app.listen(port, () => {
            this.logger.info("listening on port %s", port);
        });
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
            logger: this.logger.sublogger(name),
            router: wrappedRouter,
            app: this._app,
            websocket: this._context.websocket,
            context: this._context,
            collector: this._context.collector,
            history: this._context.historySnapshotReader
        }

        routerModule.setup(routerContext);
        
        this._app.use(routerModule.url, router);
    }

    _handleRoute(req, res, handler) {
        Promise.resolve(handler(req, res))
            .then(result => {
                res.json(result)
            })
            .catch(({ error, status }) => {
                if (process.env.NODE_ENV === 'development') {
                    res.status(status).json({ message: error.message, stack: error.stack })
                } else {
                    res.status(status).json({ message: error.message })
                }
            })
    }
}

module.exports = Server;
