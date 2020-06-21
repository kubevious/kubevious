const _ = require('the-lodash');

module.exports = ({router, app, logger, context, websocket}) => {

    router.get('/', function (req, res) {
        var result = context.markerCache.queryMarkerList();
        res.json(result);
    })

    router.get('/export', function (req, res) {
        return context.markerAccessor
            .exportMarkers()
            .then(result => {
                res.json(result)
            });
    })

    router.post('/', function (req, res) {
        var newMarker = null;
        return context.markerAccessor
            .createMarker(req.body)
            .then(result => {
                newMarker = result;
            })
            .finally(() => context.markerCache.triggerUpdate())
            .then(() => {
                res.json(newMarker);
            })
    })

    router.post('/import', function (req, res) {
        return context.markerAccessor
            .importMarkers(req.body.data, req.body.deleteExtra)
            .finally(() => context.markerCache.triggerUpdate())
            .then(() => {
                res.json({});
            });
    })

    router.get('/:name', function (req, res) {
        var result = context.markerCache.queryMarker(req.params.name);
        res.json(result);
    })

    router.get('/:name/items', function (req, res) {
        return context.markerAccessor
            .getMarkerItems(req.params.name)
            .then(result => {
                res.json(result);
            });
    })

    router.put('/:name', function (req, res) {
        return context.markerAccessor
            .updateMarker(req.params.name, req.body)
            .finally(() => context.markerCache.triggerUpdate())
            .then(() => {
                var result = context.markerCache.queryMarker(req.params.name);
                res.json(result);
            })
    })

    router.delete('/:name', function (req, res) {
        return context.markerAccessor
            .deleteMarker(req.params.name)
            .finally(() => context.markerCache.triggerUpdate())
            .then(() => {
                res.json({});
            });
    })

    app.use('/api/v1/marker', router);
};
