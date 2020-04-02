const _ = require('the-lodash');

module.exports = ({router, app, logger, collector}) => {

    router.post('/snapshot', function (req, res) {
        if (!req.body.date) {
            return res.status(400).send({
                message: 'Missing date.'
             });
        }
        var date = new Date(req.body.date);
        var result = collector.newSnapshot(date);
        res.send(result);
    })

    router.post('/snapshot/items', function (req, res) {
        if (!req.body.snapshot_id) {
            return res.status(400).send({
                message: 'Missing snapshot_id.'
             });
        }
        if (!req.body.items) {
            return res.status(400).send({
                message: 'Missing items.'
             });
        }
        var result = collector.acceptSnapshotItems(req.body.snapshot_id, req.body.items);
        res.send(result);
    })

    router.post('/snapshot/activate', function (req, res) {
        if (!req.body.snapshot_id) {
            return res.status(400).send({
                message: 'Missing snapshot_id.'
             });
        }
        var result = collector.activateSnapshot(req.body.snapshot_id);
        res.send(result);
    })

    router.post('/diff', function (req, res) {
        if (!req.body.snapshot_id) {
            return res.status(400).send({
                message: 'Missing snapshot_id.'
             });
        }
        if (!req.body.date) {
            return res.status(400).send({
                message: 'Missing date.'
             });
        }
        var date = new Date(req.body.date);
        var result = collector.newDiff(req.body.snapshot_id, date);
        res.send(result);
    })

    router.post('/diff/items', function (req, res) {
        if (!req.body.diff_id) {
            return res.status(400).send({
                message: 'Missing diff_id.'
             });
        }
        if (!req.body.items) {
            return res.status(400).send({
                message: 'Missing items.'
             });
        }
        var result = collector.acceptDiffItems(req.body.diff_id, req.body.items);
        res.send(result);
    })

    router.post('/diff/activate', function (req, res) {
        if (!req.body.diff_id) {
            return res.status(400).send({
                message: 'Missing diff_id.'
             });
        }
        var result = collector.activateDiff(req.body.diff_id);
        res.send(result);
    })

    app.use('/api/v1/collect', router);
};