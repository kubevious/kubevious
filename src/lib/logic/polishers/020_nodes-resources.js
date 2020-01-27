const _ = require("the-lodash");
const resourcesHelper = require("../helpers/resources");

module.exports = {
    target: {
        path: ["infra", "nodes"]
    },

    order: 20,

    handler: ({scope, item, logger}) =>
    {
        var nodesResourcesProps = {
        }
        var perNodeResources = {}
        for(var metric of resourcesHelper.METRICS) {
            nodesResourcesProps[metric] = { allocatable: 0, capacity: 0 };
            perNodeResources[metric] = null;
        }

        for(var node of item.getChildrenByKind('node'))
        {
            var nodeProps = node.getProperties('resources');
            if (nodeProps)
            {
                for(var metric of resourcesHelper.METRICS)
                {
                    for(var counter of _.keys(nodeProps.config[metric]))
                    {
                        var value = nodeProps.config[metric][counter];
                        nodesResourcesProps[metric][counter] += value;
                    }

                    var value = nodeProps.config[metric]['allocatable'];
                    if (value)
                    {
                        if (perNodeResources[metric] != null)
                        {
                            perNodeResources[metric] = Math.min(perNodeResources[metric], value);
                        }
                        else
                        {
                            perNodeResources[metric] = value;
                        }
                    }
                }
            }
        }

        var nodeResourcesProps = {}
        for(var metric of resourcesHelper.METRICS)
        {
            if (perNodeResources[metric] == null)
            {
                perNodeResources[metric] = 0;
            }
            nodeResourcesProps[metric] = {
                'per node': perNodeResources[metric]
            }
        }

        scope.getInfraScope().setNodeResources(perNodeResources);

        item.addProperties({
            kind: "resources",
            id: "cluster-resources",
            title: "Cluster Resources",
            order: 7,
            config: nodesResourcesProps
        });

        item.addProperties({
            kind: "resources",
            id: "node-resources",
            title: "Node Resources",
            order: 8,
            config: nodeResourcesProps
        });


        var clusterAllocatableResources = {}
        for(var metric of resourcesHelper.METRICS)
        {
            clusterAllocatableResources[metric] = nodesResourcesProps[metric].allocatable;
        }
        scope.getInfraScope().setClusterResources(clusterAllocatableResources);
    }
}