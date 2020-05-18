const _ = require('the-lodash');

module.exports = ({router, app, logger, context}) => {

    router.get('/', function (req, res) {
        return context.ruleAccessor
            .queryAllCombined()
            .then(result => {
                res.json(result);
            });
    })

    router.get('/export', function (req, res) {
        return context.ruleAccessor
            .exportRules()
            .then(result => {
                res.json(result)
            });
    })

    router.post('/', function (req, res) {
        return context.ruleAccessor
            .createRule(req.body)
            .then(result => {
                res.json(result);
            });
    })

    router.post('/import', function (req, res) {
        return context.ruleAccessor
            .importRules(req.body.data, req.body.deleteExtra)
            .then(result => {
                res.json(result);
            });
    })

    router.get('/:id', function (req, res) {
        var data = null;

        return context.ruleAccessor
            .getRule(req.params.id)
            .then(result => {
                if (result) {
                    data = {
                        rule: result,
                        items: [],
                        logs: []
                    }
                    return Promise.all([
                        context.ruleAccessor.getRuleItems(result.name).then(x => { data.items = x; }),
                        context.ruleAccessor.getRuleLogs(result.name).then(x => { data.logs = x; }),
                    ])
                }
            })
            .then(() => {
                res.json(data);
            });
    })

    router.put('/:id', function (req, res) {
        return context.ruleAccessor
            .updateRule(req.params.id, req.body)
            .then(result => {
                res.json(result);
            });
    })

    router.delete('/:id', function (req, res) {
        return context.ruleAccessor
            .deleteRule(req.params.id)
            .then(result => {
                res.json(result);
            });
    })

    app.use('/api/v1/rule', router);
};
