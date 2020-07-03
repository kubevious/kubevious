const Promise = require('the-promise');
const _ = require('the-lodash');

class MarkerCache
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("MarkerCache");

        context.database.onConnect(this._onDbConnected.bind(this));

        this._markerDict = {};
        this._markerList = [];

        this._markersStatuses = [];
        this._markerResultsDict = {};
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
            .then(() => this._updateMarkerOperationData())
    }
    
    acceptExecutionContext(executionContext)
    {
        this._acceptMarkerItems(executionContext.markerItems);
    }

    _acceptMarkerItems(items)
    {
        this._markerResultsDict = {};
        for(var x of items)
        {
            if(!this._markerResultsDict[x.marker_name])
            {
                this._markerResultsDict[x.marker_name] = {
                    name: x.marker_name,
                    items: []
                }
            } 

            this._markerResultsDict[x.marker_name].items.push({
                dn: x.dn
            })
        }
        this._updateMarkerOperationData();
    }

    _refreshMarkerItems()
    {
        return this._context.markerAccessor.getAllMarkersItems()
            .then(result => {
                this._acceptMarkerItems(result);
            })
    }

    _refreshMarkerConfigs()
    {
        return this._context.markerAccessor.queryAll()
            .then(result => {
                this._markerDict = _.makeDict(result, x => x.name);
                this._markerList = _.orderBy(result, x => x.name);
            })
            ;
    }

    _updateMarkerOperationData()
    {
        this._updateMarkersStatuses();
        this._updateMarkerResults();
    }

    _updateMarkersStatuses()
    {
        this._markersStatuses = this._markerList.map(x => this._makeMarkerStatus(x));
        this._context.websocket.update({ kind: 'markers-statuses' }, this._markersStatuses);
    }

    _makeMarkerStatus(marker)
    {
        var item_count = 0;
        var result = this._markerResultsDict[marker.name];
        if (result) {
            item_count = result.items.length;
        }
        
        return {
            name: marker.name,
            shape: marker.shape,
            color: marker.color,
            item_count: item_count
        }
    }

    _updateMarkerResults()
    {
        var items = _.values(this._markerResultsDict).map(x => ({
            target: { name: x.name },
            value: x
        }));
        this._context.websocket.updateScope({ kind: 'marker-result' }, items);
    }

    getMarkersStatuses()
    {
        return this._markersStatuses;
    }

    getMarkerResult(name)
    {
        if (this._markerResultsDict[name]) {
            return this._markerResultsDict[name];
        }
        return null;
    }

    queryMarkerList()
    {
        return this._markerList;
    }

    queryMarker(name)
    {
        var marker = this._markerDict[name];
        if (!marker) {
            return null;
        }
        return marker;
    }
}

module.exports = MarkerCache;