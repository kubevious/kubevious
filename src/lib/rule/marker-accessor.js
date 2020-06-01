const Promise = require('the-promise');
const _ = require('the-lodash');
const MySqlTableSynchronizer = require('kubevious-helpers').MySqlTableSynchronizer;

class MarkerAccessor
{
    constructor(context)
    {
        this._logger = context.logger.sublogger("MarkerAccessor");
        this._database = context.database;
        this._driver = context.database.driver;

        this._registerStatements();
    }

    get logger() {
        return this._logger;
    }

    _registerStatements()
    {
        this._driver.registerStatement('MARKERS_QUERY', 'SELECT `id`, `name`, `shape`, `color`, `propagate` FROM `markers`;');
        this._driver.registerStatement('MARKERS_EXPORT', 'SELECT `name`, `shape`, `color`, `propagate` FROM `markers`;');

        this._driver.registerStatement('MARKER_QUERY', 'SELECT `id`, `name`, `shape`, `color`, `propagate` FROM `markers` WHERE `id` = ?;');

        this._driver.registerStatement('MARKER_CREATE', 'INSERT INTO `markers`(`name`, `shape`, `color`, `propagate`) VALUES (?, ?, ?, ?)');
        this._driver.registerStatement('MARKER_DELETE', 'DELETE FROM `markers` WHERE `id` = ?;');
        this._driver.registerStatement('MARKER_UPDATE', 'UPDATE `markers` SET `name` = ?, `shape` = ?, `color` = ?, `propagate` = ? WHERE `id` = ?;');

        this._driver.registerStatement('MARKERS_ITEMS_QUERY', 'SELECT `marker_id`, `dn` FROM `marker_items`;');
        this._driver.registerStatement('MARKER_ITEMS_QUERY', 'SELECT `dn` FROM `marker_items` WHERE `marker_id` = ?;');
    }

    queryAll()
    {
        return this._execute('MARKERS_QUERY')
            .then(result => {
                return result.map(x => this._massageDbMarker(x));
            })
    }

    exportMarkers()
    {
        return this._execute('MARKERS_EXPORT')
            .then(result => {
                return result.map(x => this._massageDbMarker(x));
            })
    }

    getMarker(id)
    {
        var params = [ id ];
        return this._execute('MARKER_QUERY', params)
            .then(result => {
                return this._massageDbMarker(_.head(result));
            });
    }

    createMarker(config)
    {
        var markerObj = this._makeMarkerObj(config);
        var params = [ 
            markerObj.name,
            markerObj.shape,
            markerObj.color,
            markerObj.propagate
        ];
        return this._execute('MARKER_CREATE', params)
            .then(result => {
                var row = markerObj;
                row.id = result.insertId;
                return row;
            });
    }

    deleteMarker(id)
    {
        var params = [ id ];
        return this._execute('MARKER_DELETE', params)
            .then(result => {
                return;
            });
    }

    updateMarker(id, config)
    {
        var markerObj = this._makeMarkerObj(config);
        var params = [ 
            markerObj.name,
            markerObj.shape,
            markerObj.color,
            markerObj.propagate,
            id ];
        return this._execute('MARKER_UPDATE', params)
            .then(result => {
                var row = markerObj;
                row.id = id;
                return row;
            });
    }

    importMarkers(markers, deleteExtra)
    {
        var synchronizer = new MySqlTableSynchronizer(
            this._logger, 
            this._driver, 
            'markers', 
            [], 
            ['name', 'shape', 'color', 'propagate' ]
        );

        if (!deleteExtra) {
            synchronizer.markSkipDelete();
        }

        for(var x of markers)
        {
            if (!x.propagate) {
                x.propagate = false;
            }
        }

        return synchronizer.execute({}, markers);
    }

    getMarkersItems()
    {
        return this._execute('MARKERS_ITEMS_QUERY', [])
            .then(result => {
                return result;
            });
    }

    getMarkerItems(marker_id)
    {
        var params = [ marker_id ];
        return this._execute('MARKER_ITEMS_QUERY', params)
            .then(result => {
                return result;
            });
    }

    _execute(statementId, params)
    {
        return this._driver.executeStatement(statementId, params);
    }

    _massageDbMarker(marker)
    {
        if (!marker) {
            return null;
        }
        marker.propagate = marker.propagate ? true : false;
        return marker;
    }

    _makeMarkerObj(config)
    {
        var markerObj = {
            name: config.name,
            shape: config.shape,
            color: config.color,
            propagate: config.propagate
        }
        return markerObj;
    }
}

module.exports = MarkerAccessor;
