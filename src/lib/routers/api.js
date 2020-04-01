const _ = require('the-lodash');

module.exports = ({router, app, logger, context}) => {

    router.get('/tree', function (req, res) {
        var state = context.registry.getCurrentState();
        res.send(state.tree);
    })

    router.get('/node', function (req, res) {
        if (!req.query.dn) {
            return res.status(400).send({
                message: 'Missing dn.'
             });
        }
        var state = context.registry.getCurrentState();
        res.send(state.getNode(req.query.dn, req.query['inc-children']));
    })


    router.get('/children', function (req, res) {
        if (!req.query.dn) {
            return res.status(400).send({
                message: 'Missing dn.'
             });
        }
        var state = context.registry.getCurrentState();
        res.send(state.getChildren(req.query.dn, req.query['inc-children']));
    })

    router.get('/assets', function (req, res) {
        if (!req.query.dn) {
            return res.status(400).send({
                message: 'Missing dn.'
             });
        }
        var state = context.registry.getCurrentState();
        res.send(state.getAssets(req.query.dn));
    })

    /*************************/
    
    router.get('/search', function (req, res) {
        if (!req.query.criteria) {
            return res.status(400).send({
                message: 'Missing criteria.'
             });
        }
        res.send(context.searchEngine.search(req.query.criteria));
    })

    app.use('/api', router);
};