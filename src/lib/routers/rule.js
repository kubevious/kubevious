const _ = require('the-lodash');

module.exports = ({router, app, logger, context, websocket}) => {

    router.get('/', function (req, res) {
        var result = context.ruleCache.queryRuleList();
        res.json(result);
    })

    router.get('/debug', function (req, res) {
        res.json(context.ruleCache._ruleConfigDict);
    })

    router.get('/export', function (req, res) {
        return context.ruleAccessor
            .exportRules()
            .then(result => {
                res.json(result)
            });
    })

    router.post('/', function (req, res) {
        var newRule = null;
        return context.ruleAccessor
            .createRule(req.body)
            .then(result => {
                newRule = result;
            })
            .finally(() => context.ruleCache.triggerListUpdate())
            .then(() => {
                res.json(newRule);
            })
    })

    router.post('/import', function (req, res) {
        return context.ruleAccessor
            .importRules(req.body.data, req.body.deleteExtra)
            .finally(() => context.ruleCache.triggerListUpdate())
            .then(() => {
                res.json({});
            });
    })

    router.get('/:id', function (req, res) {
        var result = context.ruleCache.queryRule(req.params.id);
        res.json(result);
    })

    router.get('/:id/results', function (req, res) {
        var result = context.ruleCache.getRuleStatus(req.params.id);
        res.json(result);
    })

    router.put('/:id', function (req, res) {
        return context.ruleAccessor
            .updateRule(req.params.id, req.body)
            .finally(() => context.ruleCache.triggerListUpdate())
            .then(() => {
                var result = context.ruleCache.queryRule(req.params.id);
                res.json(result);
            })
    })

    router.delete('/:id', function (req, res) {
        return context.ruleAccessor
            .deleteRule(req.params.id)
            .finally(() => context.ruleCache.triggerListUpdate())
            .then(() => {
                res.json({});
            });
    })

    app.use('/api/v1/rule', router);
};
