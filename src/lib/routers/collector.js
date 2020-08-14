const _ = require('the-lodash');

module.exports = {
    url: '/api/v1/collect',

    setup: ({ router, logger, context, reportUserError }) => {

        router.post('/snapshot', function (req, res) {
            if (!req.body.date) {
                reportUserError('Missing date');
            }
            var date = new Date(req.body.date);
            return context.collector.newSnapshot(date);
        })

        router.post('/snapshot/items', function (req, res) {
            if (!req.body.snapshot_id) {
                reportUserError('Missing snapshot_id');
            }
            if (!req.body.items) {
                reportUserError('Missing items');
            }
            return context.collector.acceptSnapshotItems(req.body.snapshot_id, req.body.items);
        })

        router.post('/snapshot/activate', function (req, res) {
            if (!req.body.snapshot_id) {
                reportUserError('Missing snapshot_id');
            }
            return context.collector.activateSnapshot(req.body.snapshot_id);
        })

        router.post('/diff', function (req, res) {
            if (!req.body.snapshot_id) {
                reportUserError('Missing snapshot_id');
            }
            if (!req.body.date) {
                reportUserError('Missing date');
            }
            var date = new Date(req.body.date);
            return context.collector.newDiff(req.body.snapshot_id, date);
        })

        router.post('/diff/items', function (req, res) {
            if (!req.body.diff_id) {
                reportUserError('Missing diff_id');
            }
            if (!req.body.items) {
                reportUserError('Missing items');
            }
            return context.collector.acceptDiffItems(req.body.diff_id, req.body.items);
        })

        router.post('/diff/activate', function (req, res) {
            if (!req.body.diff_id) {
                reportUserError('Missing diff_id');
            }
            return context.collector.activateDiff(req.body.diff_id);
        })

    },

}
