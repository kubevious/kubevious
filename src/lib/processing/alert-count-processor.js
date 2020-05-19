class AlertCountProcessor
{
    constructor(logger, state)
    {
        this._logger = logger.sublogger("AlertCountProcessor");
        this._state = state;
    }

    get logger() {
        return this._logger;
    }

    execute()
    {
        this._logger.info("[execute] date: %s, count: %s", 
            this._state.date.toISOString(), 
            this._state.getCount())

        for(var dn of this._state.getNodeDns())
        {
            this._processNode(dn);
        }
    }

    _processNode(dn)
    {
        var node = this._state.editableNode(dn);
        node.alertCount = {
        };

        var assets = this._state.getAssets(dn);
        for(var alert of assets.alerts)
        {
            if (!node.alertCount[alert.severity]) {
                node.alertCount[alert.severity] = 0;
            }
            node.alertCount[alert.severity] += 1;
        }
    }

}

module.exports = AlertCountProcessor;