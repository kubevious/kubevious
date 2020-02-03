const _ = require("the-lodash");
const resourcesHelper = require("../helpers/resources");

module.exports = {
    target: {
        path: ["ns", "app"]
    },

    order: 33,

    handler: ({scope, item, logger, context}) =>
    {
        // var isRadioactive = false;
        // var podSpec = _.get(item.config, 'spec.template.spec');
        // if (podSpec)
        // {
        //     if (podSpec.hostIPC) {
        //         isRadioactive = true;
        //     }
        //     if (podSpec.hostNetwork) {
        //         isRadioactive = true;
        //     }
        //     if (podSpec.hostPID) {
        //         isRadioactive = true;
        //     }
        //     if (podSpec.privileged) {
        //         isRadioactive = true;
        //     }
        // }

        // if (isRadioactive)
        // {
        //     item.setFlag("radioactive");
        // }

    }
}
