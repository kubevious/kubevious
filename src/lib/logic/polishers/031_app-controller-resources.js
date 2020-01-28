const _ = require("the-lodash");
const resourcesHelper = require("../helpers/resources");

module.exports = {
    target: {
        path: ["ns", "app"]
    },

    order: 31,

    handler: ({scope, item, logger, context}) =>
    {
        var perPodResourcesProps = {
        }
        for(var metric of resourcesHelper.METRICS) {
            perPodResourcesProps[metric] = { request: 0 };
        }

        for(var container of item.getChildrenByKind('cont'))
        {
            var contProps = container.getProperties('resources');
            if (contProps)
            {
                for(var metric of resourcesHelper.METRICS)
                {
                    var value = _.get(contProps.config, metric + '.request');
                    if (value)
                    {
                        perPodResourcesProps[metric].request += value;
                    }
                }
            }
        }

        item.addProperties({
            kind: "resources",
            id: "resources-per-pod",
            title: "Resources Per Pod",
            order: 8,
            config: perPodResourcesProps
        });

        // ***

        var multiplier = 0;
        var launcher = _.head(item.getChildrenByKind("launcher"));
        if (launcher) 
        {
            if (launcher.config.kind == 'Deployment' || 
                launcher.config.kind == 'StatefulSet')
            {
                multiplier = _.get(launcher.config, "spec.replicas", 1);
            }
            else if (launcher.config.kind == 'DaemonSet')
            {
                multiplier = scope.getInfraScope().nodeCount;
            }
        }
        
        var usedResourcesProps = {
        }
        for(var metric of resourcesHelper.METRICS)
        {
            usedResourcesProps[metric] = { 
                request: perPodResourcesProps[metric].request * multiplier
            };
        }

        item.addProperties({
            kind: "resources",
            id: "resources",
            title: "Resources",
            order: 7,
            config: usedResourcesProps
        });

        // ***
        var myUsedResources = {};
        var availableResources = null;
        if (launcher) 
        {
            if (launcher.config.kind == 'Deployment' || 
                launcher.config.kind == 'StatefulSet')
            {
                for(var metric of resourcesHelper.METRICS)
                {
                    myUsedResources[metric] = usedResourcesProps[metric].request;
                }
                availableResources = scope.getInfraScope().clusterResources;
            }
            else if (launcher.config.kind == 'DaemonSet')
            {
                for(var metric of resourcesHelper.METRICS)
                {
                    myUsedResources[metric] = perPodResourcesProps[metric].request;
                }
                availableResources = scope.getInfraScope().nodeResources;
            }
        }

        if (availableResources)
        {
            var clusterConsumptionProps = {};
            for(var metric of _.keys(myUsedResources))
            {
                var value = myUsedResources[metric];
                var avail = availableResources[metric];
                if (!avail) {
                    value = 0;
                } else {
                    value = value / avail;
                }
                clusterConsumptionProps[metric] = value;
            }

            item.addProperties({
                kind: "percentage",
                id: "cluster-consumption",
                title: "Cluster Consumption",
                order: 9,
                config: clusterConsumptionProps
            });
        }
    }
}
