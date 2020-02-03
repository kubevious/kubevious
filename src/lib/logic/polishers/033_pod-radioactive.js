const _ = require("the-lodash");
const resourcesHelper = require("../helpers/resources");

module.exports = {
    target: {
        path: ["ns", "raw", "raw", "pod"]
    },

    order: 33,

    handler: ({scope, item, logger, context}) =>
    {
        var radioactiveProps = {};

        var podSpec = _.get(item.config, 'spec')
        if (podSpec)
        {
            if (podSpec.hostIPC) {
                radioactiveProps['hostIPC'] = true;
            }
            if (podSpec.hostNetwork) {
                radioactiveProps['hostNetwork'] = true;
            }
            if (podSpec.hostPID) {
                radioactiveProps['hostPID'] = true;
            }

            if (podSpec.containers)
            {
                for(var container of podSpec.containers)
                {
                    if (_.get(container, 'securityContext.privileged')) {
                        radioactiveProps['privileged'] = true;
                    }
                }
            }

        }

        if (_.keys(radioactiveProps).length > 0)
        {
            item.setFlag("radioactive");

            item.addProperties({
                kind: "key-value",
                id: "radioactive",
                title: "Radioactivity",
                order: 7,
                config: radioactiveProps
            });
        }

    }
}
