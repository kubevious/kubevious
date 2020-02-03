const _ = require("the-lodash");
const resourcesHelper = require("../helpers/resources");

module.exports = {
    target: {
        path: ["ns", "app", "cont"]
    },

    order: 33,

    handler: ({scope, item, logger, context}) =>
    {
        var radioactiveProps = {};

        if (_.get(item.config, 'securityContext.privileged')) {
            radioactiveProps['privileged'] = true;
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
