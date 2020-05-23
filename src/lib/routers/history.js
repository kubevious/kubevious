const _ = require("the-lodash");
const DateUtils = require("kubevious-helpers").DateUtils;

module.exports = ({logger, app, router, history}) => {

    router.get('/range', function(req, res) {
        return history.queryTimelineRange()
            .then(data => {
                var info = _.head(data);
                if (!info) {
                    info = {};
                }
                if (!info.max_date) {
                    info.max_date = new Date();
                } else {
                    info.max_date = new Date(info.max_date);
                }
                if (!info.min_date) {
                    info.min_date = info.max_date;
                } else {
                    info.min_date = new Date(info.min_date);
                }
                return res.send(info);
            })

    });

    router.get('/timeline', function(req, res) {
        var dateFrom = null;
        if (req.query.from) {
            dateFrom = DateUtils.makeDate(req.query.from);
        }
        var dateTo = null;
        if (req.query.to) {
            dateTo = DateUtils.makeDate(req.query.to);
        }

        return history.queryTimeline(dateFrom, dateTo)
            .then(data => {
                var result = data.map(x => {
                    return {
                        date: x.date,
                        items: x.summary.delta.items, //x.summary.snapshot.items
                        alerts: x.summary.snapshot.alerts,
                    }
                });
                return res.send(result);
            });
    });


    router.get('/snapshot', function(req, res) {
        if (!req.query.date) {
            return res.status(400).send({
                message: 'Missing date.'
             });
        }

        var date = DateUtils.makeDate(req.query.date); 

        return history.querySnapshotForDate(date, 'node')
            .then(snapshot => {
                if (!snapshot) {
                    return res.send({});
                }
                return res.send(snapshot.generateTree());
            })
    });

    router.get('/assets', function(req, res) {

        if (!req.query.dn) {
            return res.status(400).send({
                message: 'Missing dn.'
             });
        }

        if (!req.query.date) {
            return res.status(400).send({
                message: 'Missing date.'
             });
        }

        var date = DateUtils.makeDate(req.query.date); 
        return history.queryDnSnapshotForDate(req.query.dn, date, ['props', 'alerts'])
            .then(snapshot => {
                var result = {
                    alerts: [],
                    props: []
                }

                if (snapshot) 
                {
                    for(var item of snapshot.getItems())
                    {
                        if (item.config_kind == 'props')
                        {
                            result.props.push(item.config);
                        } 
                        else if (item.config_kind == 'alerts')
                        {
                            result.alerts = item.config;
                        }
                    }
                }
                return res.send(result);
            })
    });

    app.use('/api/v1/history', router);
};