const _ = require("the-lodash");
const NameHelpers = require("../../utils/name-helpers.js");

module.exports = {
    target: {
        api: "v1",
        kind: "Pod"
    },

    kind: 'pod',

    order: 100,

    handler: ({scope, item, createK8sItem, createAlert, hasCreatedItems}) =>
    {
        var conditions = _.get(item.config, 'status.conditions');
        if (conditions) {
            for(var condition of conditions) {
                if (condition.status != 'True') {
                    var msg = 'There was error with ' + condition.type + '. ';
                    if (condition.message) {
                        msg += condition.message;
                    }
                    createAlert(condition.type, 'error', condition.lastTransitionTime, msg);
                }
            }
        }

        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);
        if (item.config.metadata.ownerReferences)
        {
            for(var ref of item.config.metadata.ownerReferences)
            {
                var ownerItems =  namespaceScope.getAppOwners(ref.kind, ref.name);
                for(var ownerItem of ownerItems) 
                {
                    var shortName = NameHelpers.makeRelativeName(ownerItem.config.metadata.name, item.config.metadata.name);
                    createK8sItem(ownerItem, { name: shortName });
                }
            }
        }

        if (!hasCreatedItems()) {
            var rawContainer = scope.fetchRawContainer(item, "Pods");
            createK8sItem(rawContainer);
            createAlert('MissingController', 'warn', null, 'Controller not found.');
        }

    }
}