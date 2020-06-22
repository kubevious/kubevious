const _ = require('the-lodash');

module.exports = ({router, app, logger, context, websocket}) => {

    /**** Marker Configuration ***/

    // List Makers
    router.get('/markers/', function (req, res) {
        var result = context.markerCache.queryMarkerList();
        result = result.map(x => ({
            name: x.name,
            shape: x.shape,
            color: x.color
        }));
        res.json(result);
    })

    // Get Marker
    router.get('/marker/:name', function (req, res) {
        var result = context.markerCache.queryMarker(req.params.name);
        res.json(result);
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
                res.json(newMarker);
            })
    })

    // Delete Marker
    router.delete('/marker/:name', function (req, res) {
        return context.markerAccessor
            .deleteMarker(req.params.name)
            .finally(() => context.markerCache.triggerUpdate())
            .then(() => {
                res.json({});
            });
    })

    // Export Makers
    router.get('/markers/export', function (req, res) {
        return context.markerAccessor
            .exportMarkers()
            .then(result => {
                res.json(result);
            });
    })

    // Import Makers
    router.post('/markers/import', function (req, res) {
        return context.markerAccessor
            .importMarkers(req.body.data, req.body.deleteExtra)
            .finally(() => context.markerCache.triggerUpdate())
            .then(() => {
                res.json({});
            });
    })

    /**** Marker Operational ***/

    // Get Marker Result
    router.get('/marker/:name/items', function (req, res) {
        return context.markerAccessor
            .getMarkerItems(req.params.name)
            .then(result => {
                res.json(result);
            });
    })

    app.use('/api/v1', router);
};
