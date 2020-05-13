class ParserAlertsPreprocessor
{
    constructor(logger, state)
    {
        this._logger = logger.sublogger("ParserAlertsPreprocessor");
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
        var assets = this._state.getAssets(dn);
        for(var alert of assets.alerts)
        {
            alert.source = {
                kind: 'parser'
            };
        }
    }

}

module.exports = ParserAlertsPreprocessor;