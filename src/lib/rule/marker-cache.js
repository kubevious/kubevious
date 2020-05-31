const Promise = require('the-promise');
const _ = require('the-lodash');

class MarkerCache
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("MarkerCache");
        this._database = context.database;
        this._driver = context.database.driver;

        context.database.onConnect(this._onDbConnected.bind(this));

        this._markerDict = {};
        this._markerList = [];
    }

    get logger() {
        return this._logger;
    }

    _onDbConnected()
    {
        this._logger.info("[_onDbConnected] ...");

        return Promise.resolve()
            .then(() => this._refreshMarkerConfigs())
    }

    triggerUpdate()
    {
        return Promise.resolve()
            .then(() => this._refreshMarkerConfigs())
    }

    _refreshMarkerConfigs()
    {
        return this._context.markerAccessor.queryAll()
            .then(result => {
                this._markerDict = _.makeDict(result, x => x.id);
                this._markerList = result;
                this._context.websocket.update({ kind: 'markers' }, this._markerList);
            })
            ;
    }

    queryMarkerList()
    {
        return this._markerList;
    }

    queryMarker(id)
    {
        var marker = this._markerDict[id];
        if (!marker) {
            return null;
        }
        return marker;
    }
}

module.exports = MarkerCache;