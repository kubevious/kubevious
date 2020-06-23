const _ = require('the-lodash');

module.exports = {
    url: '/api',

    setup: ({ router, logger }) => {

        router.get('/tree', function (req, res) {
            var state = context.registry.getCurrentState();
            return state.getTree();
        })

        router.get('/node', function (req, res) {
            if (!req.query.dn) {
                return res.status(400).send({
                    message: 'Missing dn.'
                });
            }
            var state = context.registry.getCurrentState();
            return state.getNode(req.query.dn, req.query['inc-children']);
        })

        router.get('/children', function (req, res) {
            if (!req.query.dn) {
                return res.status(400).send({
                    message: 'Missing dn.'
                });
            }
            var state = context.registry.getCurrentState();
            return state.getChildren(req.query.dn, req.query['inc-children'])
        })

        router.get('/assets', function (req, res) {
            if (!req.query.dn) {
                return res.status(400).send({
                    message: 'Missing dn.'
                });
            }
            var state = context.registry.getCurrentState();
            var assets = state.getAssets(req.query.dn);
            assets.props = _.values(assets.props);
            return assets;
        })

        /*************************/
        
        router.get('/search', function (req, res) {
            if (!req.query.criteria) {
                return res.status(400).send({
                    message: 'Missing criteria.'
                });
            }
            return context.searchEngine.search(req.query.criteria);
        })
    }

}