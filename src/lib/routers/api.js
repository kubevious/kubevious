const _ = require('the-lodash');

module.exports = ({router, app, logger, context}) => {

    router.get('/tree', function (req, res) {
        res.send(context.facadeRegistry.logicTree);
    })

    router.get('/names', function (req, res) {
        res.send(context.facadeRegistry.getItemList());
    })

    router.get('/get', function (req, res) {
        if (!req.query.dn) {
            return res.status(400).send({
                message: 'Missing dn.'
             });
        }
        res.send(context.facadeRegistry.getItem(req.query.dn));
    })

    router.get('/children', function (req, res) {
        if (!req.query.dn) {
            return res.status(400).send({
                message: 'Missing dn.'
             });
        }
        res.send(context.facadeRegistry.getItemChildren(req.query.dn));
    })

    router.get('/config', function (req, res) {
        if (!req.query.dn) {
            return res.status(400).send({
                message: 'Missing dn.'
             });
        }
        res.send(context.facadeRegistry.getConfig(req.query.dn));
    })

    router.get('/properties', function (req, res) {
        if (!req.query.dn) {
            return res.status(400).send({
                message: 'Missing dn.'
             });
        }
        res.send(context.facadeRegistry.getItemProperties(req.query.dn));
    })

    router.get('/alerts', function (req, res) {
        if (!req.query.dn) {
            return res.status(400).send({
                message: 'Missing dn.'
             });
        }
        res.send(context.facadeRegistry.getItemAlerts(req.query.dn));
    })

    router.get('/config-tree', function (req, res) {
        res.send(context.facadeRegistry.configTree);
    })

    router.get('/concrete/registry', function (req, res) {
        res.send(context.concreteRegistry.dump());
    })

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