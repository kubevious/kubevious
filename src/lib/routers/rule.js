const _ = require('the-lodash');

module.exports = {
    url: '/api/v1',

    setup: ({ router, logger, context, reportUserError }) => {

        /**** Rule Configuration ***/

        // List Rules
        router.get('/rules/', function (req, res) {
            var result = context.ruleCache.queryRuleList();
            return result;
        })

        // Get Rule
        router.get('/rule/:name', function (req, res) {
            var result = context.ruleCache.queryRule(req.params.name);
            return result;
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
                    return newRule;
                })
        })

        // Delete Rule
        router.delete('/rule/:name', function (req, res) {
            return context.ruleAccessor
                .deleteRule(req.params.name)
                .finally(() => context.ruleCache.triggerListUpdate())
                .then(() => {
                    return {};
                });
        })

        // Export Rules
        router.get('/rules/export', function (req, res) {
            return context.ruleAccessor
                .exportRules();
        })

        // Import Rules
        router.post('/rules/import', function (req, res) {

            if (req.body.data.kind != 'rules') {
                reportUserError('Invalid data provided for import');
            }

            return context.ruleAccessor
                .importRules(req.body.data, req.body.deleteExtra)
                .finally(() => context.ruleCache.triggerListUpdate())
                .then(() => {
                    return {};
                });
        })

        /**** Rule Operational ***/

        // List Rules Statuses
        router.get('/rules-statuses/', function (req, res) {
            var result = context.ruleCache.queryRuleStatusList();
            return result;
        })

        router.get('/rule-result/:name', function (req, res) {
            var result = context.ruleCache.getRuleResult(req.params.name);
            return result;
        })
        
    }

}
