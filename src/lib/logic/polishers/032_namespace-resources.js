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
        for(var metric of resourcesHelper.METRICS) {
            usedResourcesProps[metric] = { request: 0 };
            clusterConsumptionProps[metric] = 0;
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
                    }
                }
            }
        }

        item.addProperties({
            kind: "resources",
            id: "resources",
            title: "Resources",
            order: 7,
            config: usedResourcesProps
        });

        item.addProperties({
            kind: "percentage",
            id: "cluster-consumption",
            title: "Cluster Consumption",
            order: 9,
            config: clusterConsumptionProps
        });
    }
}