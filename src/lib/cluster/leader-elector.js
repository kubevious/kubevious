const Promise = require('the-promise');
const _ = require('lodash');

class ClusterLeaderElector
{
    constructor(context, client)
    {
        this._context = context;
        this._logger = context.logger.sublogger("ClusterLeaderElector");
        this._client = client;

        this.logger.info("[constructed] ")
    }

    get logger() {
        return this._logger;
    }
    
}

module.exports = ClusterLeaderElector;