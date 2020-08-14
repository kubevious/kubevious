const WebSocketServer = require('websocket-subscription-server').WebSocketServer;

class Server
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("WebSocketServer");
    }

    get logger() {
        return this._logger;
    }

    run(httpServer)
    {
        this._socket = new WebSocketServer(this._logger.sublogger('WebSocket'), httpServer, '/socket');
        this._socket.run();
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
