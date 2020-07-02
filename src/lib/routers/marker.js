const _ = require('the-lodash');

module.exports = {
    url: '/api/v1',

    setup: ({ router, logger, context, reportUserError }) => {

        /**** Marker Configuration ***/

        // List Makers
        router.get('/markers/', function (req, res) {
            var result = context.markerCache.queryMarkerList();
            result = result.map(x => ({
                name: x.name,
                shape: x.shape,
                color: x.color
            }));
            return result;
        })

        // Get Marker
        router.get('/marker/:name', function (req, res) {
            var result = context.markerCache.queryMarker(req.params.name);
            return result;
        })

        // Create Marker
        router.post('/marker/:name', function (req, res) {
            var newMarker = null;
            return context.markerAccessor
                .createMarker(req.body, { name: req.params.name })
                .then(result => {
                    newMarker = result;
                })
                .finally(() => context.markerCache.triggerUpdate())
                .then(() => {
                    return newMarker;
                })
        })

        // Delete Marker
        router.delete('/marker/:name', function (req, res) {
            return context.markerAccessor
                .deleteMarker(req.params.name)
                .finally(() => context.markerCache.triggerUpdate())
                .then(() => {
                    return {};
                });
        })

        // Export Makers
        router.get('/markers/export', function (req, res) {
            return context.markerAccessor
                .exportMarkers();
        })

        // Import Makers
        router.post('/markers/import', function (req, res) {
            if (req.body.data.kind != 'markers') {
                reportUserError('Invalid data provided for import');
            }

            return context.markerAccessor
                .importMarkers(req.body.data, req.body.deleteExtra)
                .finally(() => context.markerCache.triggerUpdate())
                .then(() => {
                    return {};
                });
        })

        /**** Marker Operational ***/

        // List Marker Statuses
        router.get('/markers-statuses', function (req, res) {
            var result = context.markerCache.getMarkersStatuses()
            return result;
        })
        
        // Get Marker Result
        router.get('/marker-result/:name', function (req, res) {
            var result = context.markerCache.getMarkerResult(req.params.name)
            return result;
        })
        
    }

}