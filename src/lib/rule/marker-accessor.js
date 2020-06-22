const Promise = require('the-promise');
const _ = require('the-lodash');

class MarkerAccessor
{
    constructor(context, dataStore)
    {
        this._logger = context.logger.sublogger("MarkerAccessor");
        this._dataStore = dataStore;
    }

    get logger() {
        return this._logger;
    }

    queryAll()
    {
        return this._dataStore.table('markers')
            .queryMany();
    }

    exportMarkers()
    {
        return this.queryAll();
    }

    getMarker(name)
    {
        return this._dataStore.table('markers')
            .query({ name: name });
    }

    createMarker(config, target)
    {
        return Promise.resolve()
            .then((() => {
                if (target) {
                    if (config.name != target.name) {
                        return this._dataStore.table('markers')
                            .delete(target);
                    }
                }
            }))
            .then(() => {
                return this._dataStore.table('markers')
                    .createOrUpdate({ 
                        name: config.name,
                        shape: config.shape,
                        color: config.color,
                        propagate: config.propagate
                    })
            });
    }

    deleteMarker(name)
    {
        return this._dataStore.table('markers')
            .delete({ 
                name: name
            });
    }

    importMarkers(markers, deleteExtra)
    {
        return this._dataStore.table('markers')
            .synchronizer(null, !deleteExtra)
            .execute(markers)
    }

    getAllMarkersItems()
    {
        return this._dataStore.table('marker_items')
            .queryMany();
    }

    getMarkerItems(name)
    {
        return this._dataStore.table('marker_items')
            .queryMany({ marker_name: name });
    }

}

module.exports = MarkerAccessor;
