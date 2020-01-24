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
        for(var metric of resourcesHelper.METRICS) {
            usedResourcesProps[metric] = { request: 0 };
        }

        for(var app of item.getChildrenByKind('app'))
        {
            var appProps = app.getProperties('resources');
            if (appProps)
            {
                for(var metric of resourcesHelper.METRICS)
                {
                    var value = _.get(appProps.config, metric + '.request');
                    if (value)
                    {
                        usedResourcesProps[metric].request += value;
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
    }
}