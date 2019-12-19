const _ = require('the-lodash');

module.exports = ({router, app, logger, context}) => {

    router.get('/tree', function (req, res) {
        res.send(context.facadeRegistry.logicTree);
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
        res.send(context.facadeRegistry.getProperties(req.query.dn));
    })

    router.get('/config-tree', function (req, res) {
        res.send(context.facadeRegistry.configTree);
    })

    router.get('/concrete/registry', function (req, res) {
        res.send(context.concreteRegistry.dump());
    })

    app.use('/api', router);
};