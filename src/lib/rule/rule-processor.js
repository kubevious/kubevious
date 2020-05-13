const Promise = require('the-promise');
const _ = require('the-lodash');

class RuleProcessor
{
    constructor(context)
    {
        this._logger = context.logger.sublogger("RuleProcessor");
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

    execute(state)
    {
        this._logger.info("[execute] date: %s, count: %s", 
            state.date.toISOString(),
            state.getCount())

    }

    
}

module.exports = RuleProcessor;
