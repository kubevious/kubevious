const _ = require("the-lodash");
const NameHelpers = require("../../utils/name-helpers.js");

module.exports = {
    target: {
        api: "v1",
        kind: "Pod"
    },

    order: 100,

    handler: ({scope, item}) =>
    {
        var rawPods = scope.fetchRawContainer(item, "Pods");
        var k8sPod = rawPods.fetchByNaming("pod", item.config.metadata.name);
        scope.setK8sConfig(k8sPod, item.config);

        var conditions = _.get(item.config, 'status.conditions');
        if (conditions) {
            for(var condition of conditions) {
                if (condition.status != 'True') {
                    var msg = 'There was error with ' + condition.type + '. ';
                    if (condition.message) {
                        msg += condition.message;
                    }
                    k8sPod.addAlert(condition.type, 'error', condition.lastTransitionTime, msg);
                }
            }
        }

        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);

        if (item.config.metadata.ownerReferences)
        {
            for(var ref of item.config.metadata.ownerReferences)
            {
                if (ref.kind == "ReplicaSet") {
                    if (namespaceScope.replicaSets[ref.name]) {
                        for(var replicaSet of namespaceScope.replicaSets[ref.name]) 
                        {
                            var shortName = NameHelpers.makeRelativeName(replicaSet.config.metadata.name, item.config.metadata.name);
                            var rsPod = replicaSet.fetchByNaming("pod", shortName);
                            scope.setK8sConfig(rsPod, item.config);
                            rsPod.cloneAlertsFrom(k8sPod);
                        }
                    }
                }
            }
        }
    }
}