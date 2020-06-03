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
        node.selfAlertCount = {
        };

        var assets = this._state.getAssets(dn);
        for(var alert of assets.alerts)
        {
            if (!node.selfAlertCount[alert.severity]) {
                node.selfAlertCount[alert.severity] = 0;
            }
            node.selfAlertCount[alert.severity] += 1;
        }
    }

}

module.exports = AlertCountProcessor;