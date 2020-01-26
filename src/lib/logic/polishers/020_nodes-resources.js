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
        for(var metric of resourcesHelper.METRICS) {
            nodesResourcesProps[metric] = { allocatable: 0, capacity: 0 };
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
                }
            }
        }

        item.addProperties({
            kind: "resources",
            id: "resources",
            title: "Resources",
            order: 7,
            config: nodesResourcesProps
        });
    }
}