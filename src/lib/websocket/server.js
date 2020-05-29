const WebSocketServer = require('websocket-subscription-server').WebSocketServer;

class Server
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("WebSocketServer");

        this.database.onConnect(this._onDbConnected.bind(this));
    }

    get logger() {
        return this._logger;
    }

    get database() {
        return this._context.database;
    }

    run(httpServer)
    {
        this._socket = new WebSocketServer(this._logger.sublogger('WebSocket'), httpServer, '/socket');
        this._socket.run();
    }

    _onDbConnected()
    {
        this.logger.info("[onDbConnected]");
    }

    update(key, value)
    {
        this.logger.debug("[update] ", key, value);

        if (!this._socket) {
            return;
        }
        this._socket.update(key, value);
    }

    updateScope(key, value)
    {
        this.logger.debug("[updateScope] ", key, value);
        
        if (!this._socket) {
            return;
        }
        this._socket.updateScope(key, value);
    }
}

module.exports = Server;