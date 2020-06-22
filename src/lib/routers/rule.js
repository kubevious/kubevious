const _ = require('the-lodash');

module.exports = ({router, app, logger, context, websocket}) => {

    /**** Rule Configuration ***/

    // List Rules
    router.get('/rules/', function (req, res) {
        var result = context.ruleCache.queryRuleList();
        res.json(result);
    })

    // Get Rule
    router.get('/rule/:name', function (req, res) {
        var result = context.ruleCache.queryRule(req.params.name);
        res.json(result);
    })

    // Create Rule
    router.post('/rule/:name', function (req, res) {
        var newRule = null;
        return context.ruleAccessor
            .createRule(req.body, { name: req.params.name })
            .then(result => {
                newRule = result;
            })
            .finally(() => context.ruleCache.triggerListUpdate())
            .then(() => {
                res.json(newRule);
            })
    })

    // Delete Rule
    router.delete('/rule/:name', function (req, res) {
        return context.ruleAccessor
            .deleteRule(req.params.name)
            .finally(() => context.ruleCache.triggerListUpdate())
            .then(() => {
                res.json({});
            });
    })

    router.get('/rules/export', function (req, res) {
        return context.ruleAccessor
            .exportRules()
            .then(result => {
                res.json(result)
            });
    })

    router.post('/rules/import', function (req, res) {
        return context.ruleAccessor
            .importRules(req.body.data, req.body.deleteExtra)
            .finally(() => context.ruleCache.triggerListUpdate())
            .then(() => {
                res.json({});
            });
    })

    /**** Rule Operational ***/



    // List Rules Statuses
    router.get('/rules/', function (req, res) {
        var result = context.ruleCache.queryRuleList();
        res.json(result);
    })

    router.get('/rules/:id/results', function (req, res) {
        var result = context.ruleCache.getRuleStatus(req.params.id);
        res.json(result);
    })


    app.use('/api/v1', router);
};
