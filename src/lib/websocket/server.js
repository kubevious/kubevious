const WebSocketServer = require('websocket-subscription-server').WebSocketServer;

class Server
{
    constructor(context, httpServer)
    {
        this._context = context;
        this._logger = context.logger.sublogger("WebSocketServer");

        this._socket = new WebSocketServer(httpServer, '/socket');
        this._socket.run();

        this.database.onConnect(this._onDbConnected.bind(this));
    }

    get logger() {
        return this._logger;
    }

    get database() {
        return this._context.database;
    }

    _onDbConnected()
    {
        this.logger.info("[onDbConnected]");

        return this._queryRules();
    }

    _queryRules()
    {
        return this._context.ruleAccessor
            .queryAllCombined()
            .then(result => {
                this._logger.info("RULES: ", result);
                this._socket.update({ kind: 'rules' }, result);
            });
    }
}

module.exports = Server;