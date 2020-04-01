const Promise = require('the-promise');
const _ = require('lodash');
const State = require('./state');

class Registry
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("Registry");
        this._stateLogger = context.logger.sublogger("RegistryState");

        this._currentState = new State(this._stateLogger, { date: new Date(), items: {}});
    }

    get logger() {
        return this._logger;
    }

    getCurrentState()
    {
        return this._currentState;
    }

    accept(snapshotInfo)
    {
        this._currentState = new State(this._stateLogger, snapshotInfo);
    }

}

module.exports = Registry;