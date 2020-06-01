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
        this._markerNameToIdDict = {};
        this._markerList = [];

        this._markerItems = {};
    }

    get logger() {
        return this._logger;
    }

    _onDbConnected()
    {
        this._logger.info("[_onDbConnected] ...");

        return Promise.resolve()
            .then(() => this._refreshMarkerConfigs())
            .then(() => this._refreshMarkerItems())
    }

    triggerUpdate()
    {
        return Promise.resolve()
            .then(() => this._refreshMarkerConfigs())
    }

    getMarkerId(name)
    {
        var id = this._markerNameToIdDict[name];
        if (!id) {
            return null;
        }
        return id;
    }

    acceptExecutionContext(executionContext)
    {
        this._acceptMarkerItems(executionContext.markerItems);
    }

    _acceptMarkerItems(items)
    {
        // this._logger.info("**** ", items)
        this._markerItems = {};
        for(var x of items)
        {
            if(!this._markerItems[x.marker_id])
            {
                this._markerItems[x.marker_id] = {
                    target: { id: x.marker_id },
                    value: []
                }
            }
            this._markerItems[x.marker_id].value.push({
                dn: x.dn
            })
        }
        this._notifyMarkerItems();
    }

    _refreshMarkerItems()
    {
        return this._context.markerAccessor.getMarkersItems()
            .then(result => {
                this._acceptMarkerItems(result);
            })
    }

    _refreshMarkerConfigs()
    {
        return this._context.markerAccessor.queryAll()
            .then(result => {
                this._markerDict = _.makeDict(result, x => x.id);
                this._markerList = result;
                this._markerNameToIdDict = _.makeDict(result, x => x.name, x => x.id);
                this._context.websocket.update({ kind: 'markers' }, this._markerList);
            })
            ;
    }

    _notifyMarkerItems()
    {
        this._context.websocket.updateScope({ kind: 'marker-items' }, _.values(this._markerItems));
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