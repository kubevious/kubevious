const _ = require("the-lodash");
const resourcesHelper = require("../helpers/resources");

module.exports = {
    target: {
        path: ["ns"]
    },

    order: 32,

    handler: ({scope, item, logger}) =>
    {
        var usedResourcesProps = {
        }
        var clusterConsumptionProps = {};
        var appsByConsumptionTable = {
            headers: [
                {
                    id: 'dn',
                    label: 'Application'
                }
            ],
            shortcuts: {
                'dn': true
            },
            rows: []
        }
        var appsByConsumptionDict = {};
        for(var metric of resourcesHelper.METRICS) {
            usedResourcesProps[metric] = { request: 0 };
            clusterConsumptionProps[metric] = 0;
            appsByConsumptionTable.headers.push(metric);
        }

        for(var app of item.getChildrenByKind('app'))
        {
            var appResourcesProps = app.getProperties('resources');
            if (appResourcesProps)
            {
                for(var metric of resourcesHelper.METRICS)
                {
                    var value = _.get(appResourcesProps.config, metric + '.request');
                    if (value)
                    {
                        usedResourcesProps[metric].request += value;
                    }
                }
            }

            var appUsedResourcesProps = app.getProperties('cluster-consumption');
            if (appUsedResourcesProps)
            {
                for(var metric of resourcesHelper.METRICS)
                {
                    var value = appUsedResourcesProps.config[metric];
                    if (value)
                    {
                        clusterConsumptionProps[metric] += value;

                        if (!appsByConsumptionDict[app.dn]) {
                            appsByConsumptionDict[app.dn] = {
                                dn: app.dn
                            }
                        }
                        appsByConsumptionDict[app.dn][metric] = value;
                    }
                }
            }
        }

        item.addProperties({
            kind: "resources",
            id: "resources",
            title: "Resources",
            order: 6,
            config: usedResourcesProps
        });

        item.addProperties({
            kind: "percentage",
            id: "cluster-consumption",
            title: "Cluster Consumption",
            order: 7,
            config: clusterConsumptionProps
        });

        /********/
        for(var appConsumption of _.values(appsByConsumptionDict))
        {
            for(var metric of resourcesHelper.METRICS)
            {
                if (_.isNullOrUndefined(appConsumption[metric]))
                {
                    appConsumption[metric] = 0;
                }
            }
            appConsumption['max'] = _.max(resourcesHelper.METRICS.map(metric => appConsumption[metric]));
        }
        appsByConsumptionTable.rows = _.values(appsByConsumptionDict);
        appsByConsumptionTable.rows = _.orderBy(appsByConsumptionTable.rows, ['max'], 'desc');
        for(var appConsumption of _.values(appsByConsumptionDict))
        {
            for(var metric of resourcesHelper.METRICS)
            {
                if (_.isNullOrUndefined(appConsumption[metric]))
                {
                    appConsumption[metric] = 0;
                }
                appConsumption[metric] = resourcesHelper.percentage(appConsumption[metric]);
            }
        }
        item.addProperties({
            kind: "table",
            id: "app-consumption",
            title: "Application Consumption",
            order: 8,
            config: appsByConsumptionTable
        });
    }
}