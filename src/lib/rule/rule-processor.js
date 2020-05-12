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

    execute(snapshotInfo)
    {
        this._logger.info("[execute] %s", snapshotInfo.constructor.name)
        this._logger.info("[execute] ", _.keys(snapshotInfo.items))
        return;
    }
}

module.exports = RuleProcessor;
