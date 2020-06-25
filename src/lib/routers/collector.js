const _ = require('the-lodash');

module.exports = {
    url: '/api/v1/collect',

    setup: ({ router, logger, collector }) => {

        router.post('/snapshot', function (req, res) {
            if (!req.body.date) {
                return Promise.reject({ error: new Error('Missing date.'), status: 400 })
            }
            var date = new Date(req.body.date);
            return collector.newSnapshot(date);
        })

        router.post('/snapshot/items', function (req, res) {
            if (!req.body.snapshot_id) {
                return Promise.reject({ error: new Error('Missing snapshot_id.'), status: 400 })
            }
            if (!req.body.items) {
                return Promise.reject({ error: new Error('Missing items.'), status: 400 })
            }
            return collector.acceptSnapshotItems(req.body.snapshot_id, req.body.items);
        })

        router.post('/snapshot/activate', function (req, res) {
            if (!req.body.snapshot_id) {
                return Promise.reject({ error: new Error('Missing snapshot_id.'), status: 400 })
            }
            return collector.activateSnapshot(req.body.snapshot_id);
        })

        router.post('/diff', function (req, res) {
            if (!req.body.snapshot_id) {
                return Promise.reject({ error: new Error('Missing snapshot_id.'), status: 400 })
            }
            if (!req.body.date) {
                return Promise.reject({ error: new Error('Missing date.'), status: 400 })
            }
            var date = new Date(req.body.date);
            return collector.newDiff(req.body.snapshot_id, date);
        })

        router.post('/diff/items', function (req, res) {
            if (!req.body.diff_id) {
                return Promise.reject({ error: new Error('Missing diff_id.'), status: 400 })
            }
            if (!req.body.items) {
                return Promise.reject({ error: new Error('Missing items.'), status: 400 })
            }
            return collector.acceptDiffItems(req.body.diff_id, req.body.items);
        })

        router.post('/diff/activate', function (req, res) {
            if (!req.body.diff_id) {
                return Promise.reject({ error: new Error('Missing diff_id.'), status: 400 })
            }
            return collector.activateDiff(req.body.diff_id);
        })

    },

}
