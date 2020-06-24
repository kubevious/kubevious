const _ = require('the-lodash');

module.exports = {
    url: '/api/v1/collect',

    setup: ({ router, logger, collector }) => {

        router.post('/snapshot', function (req, res) {
            if (!req.body.date) {
                return res.status(400).send({
                    message: 'Missing date.'
                });
            }
            var date = new Date(req.body.date);
            return collector.newSnapshot(date);
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
            return collector.acceptSnapshotItems(req.body.snapshot_id, req.body.items);
        })

        router.post('/snapshot/activate', function (req, res) {
            if (!req.body.snapshot_id) {
                return res.status(400).send({
                    message: 'Missing snapshot_id.'
                });
            }
            return collector.activateSnapshot(req.body.snapshot_id);
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
            return collector.newDiff(req.body.snapshot_id, date);
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
            return collector.acceptDiffItems(req.body.diff_id, req.body.items);
        })

        router.post('/diff/activate', function (req, res) {
            if (!req.body.diff_id) {
                return res.status(400).send({
                    message: 'Missing diff_id.'
                });
            }
            return collector.activateDiff(req.body.diff_id);
        })
        
    }

}