const Promise = require('the-promise');
const _ = require('lodash');
const State = require('./state');

class Registry
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("Registry");

        this._currentState = new State({ date: new Date(), items: {}});
    }

    get logger() {
        return this._logger;
    }

    getCurrentState()
    {
        return this._currentState;
    }

    accept(state)
    {
        this._currentState = state;
    }

}

module.exports = Registry;