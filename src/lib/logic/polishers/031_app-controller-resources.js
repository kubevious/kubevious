const _ = require("the-lodash");
const resourcesHelper = require("../helpers/resources");

module.exports = {
    target: {
        path: ["ns", "app"]
    },

    order: 31,

    handler: ({scope, item, logger}) =>
    {
        // logger.error("******* 031_app-controller-resources : %s", item.dn);

        var resourcesProps = {
        }
        for(var metric of resourcesHelper.METRICS) {
            resourcesProps[metric] = { request: 0 };
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
                        resourcesProps[metric].request += value;
                    }
                }
            }
        }

        item.addProperties({
            kind: "resources",
            id: "resources-per-pod",
            title: "Resources Per Pod",
            order: 7,
            config: resourcesProps
        });
    }
}