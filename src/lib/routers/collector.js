const _ = require('the-lodash');

module.exports = ({router, app, logger, context}) => {

    router.post('/snapshot', function (req, res) {
        if (!req.body.date) {
            return res.status(400).send({
                message: 'Missing date.'
             });
        }
        res.send({ aaa: req.body.date});
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
        res.send({ aaa: 'xxx'});
    })

    router.post('/snapshot/activate', function (req, res) {
        if (!req.body.snapshot_id) {
            return res.status(400).send({
                message: 'Missing snapshot_id.'
             });
        }
        res.send({ aaa: 'xxx'});
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
        res.send({ aaa: req.body.date});
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
        res.send({ aaa: 'xxx'});
    })

    router.post('/diff/activate', function (req, res) {
        if (!req.body.diff_id) {
            return res.status(400).send({
                message: 'Missing diff_id.'
             });
        }
        res.send({ aaa: 'xxx'});
    })

    app.use('/api/v1/collect', router);
};