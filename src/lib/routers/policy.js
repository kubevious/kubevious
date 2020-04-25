const _ = require('the-lodash');

module.exports = ({router, app, logger, context}) => {

    router.get('/', function (req, res) {
        return context.policyAccessor
            .listAll()
            .then(result => {
                res.json(result);
            });
    })

    router.post('/', function (req, res) {
        return context.policyAccessor
            .createPolicy(req.body)
            .then(result => {
                res.json(result);
            });
    })

    router.get('/:id', function (req, res) {
        return context.policyAccessor
            .getPolicy(req.params.id)
            .then(result => {
                res.json(result);
            });
    })

    router.put('/:id', function (req, res) {
        return context.policyAccessor
            .updatePolicy(req.params.id, req.body)
            .then(result => {
                res.json(result);
            });
    })

    router.delete('/:id', function (req, res) {
        return context.policyAccessor
            .deletePolicy(req.params.id)
            .then(result => {
                res.json(result);
            });
    })

    app.use('/api/v1/policy', router);
};