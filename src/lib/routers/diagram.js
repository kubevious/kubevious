const _ = require('the-lodash');

module.exports = {
    url: '/api/v1/diagram',

    setup: ({ router, logger, context, reportUserError }) => {

        router.get('/tree', function (req, res) {
            var state = context.registry.getCurrentState();
            return state.getTree();
        })

        router.get('/node', function (req, res) {
            if (!req.query.dn) {
                reportUserError('Missing dn.');
            }
            var state = context.registry.getCurrentState();
            return state.getNode(req.query.dn, req.query['inc-children']);
        })

        router.get('/children', function (req, res) {
            if (!req.query.dn) {
                reportUserError('Missing dn.');
            }
            var state = context.registry.getCurrentState();
            return state.getChildren(req.query.dn, req.query['inc-children'])
        })

        router.get('/props', function (req, res) {
            if (!req.query.dn) {
                reportUserError('Missing dn.');
            }
            var state = context.registry.getCurrentState();
            var props = state.getProperties(req.query.dn);
            props = _.values(props);
            return props;
        })


        router.get('/alerts', function (req, res) {
            if (!req.query.dn) {
                reportUserError('Missing dn.');
            }
            var state = context.registry.getCurrentState();
            var alerts = state.getAlerts(req.query.dn);
            return alerts;
        })


        /*************************/

        router.get('/search', function (req, res) {
            if (!req.query.criteria) {
                reportUserError('Missing criteria.');
            }
            return context.searchEngine.search(req.query.criteria);
        })
    },

}
