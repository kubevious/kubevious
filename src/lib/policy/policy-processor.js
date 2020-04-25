const Promise = require('the-promise');
const _ = require('the-lodash');

class PolicyProcessor
{
    constructor(context)
    {
        this._logger = context.logger.sublogger("PolicyProcessor");
        context.database.onConnect(this._onDbConnected.bind(this));
    }

    get logger() {
        return this._logger;
    }

    _onDbConnected()
    {
        this._logger.info("[_onDbConnected] ...");
        return Promise.resolve()
    }
}

module.exports = PolicyProcessor;