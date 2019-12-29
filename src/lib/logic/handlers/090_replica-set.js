const NameHelpers = require("../../utils/name-helpers.js");

module.exports = {
    target: {
        api: "apps",
        kind: "ReplicaSet"
    },

    kind: 'replicaset',

    order: 90,

    handler: ({scope, item, createK8sItem, createAlert, hasCreatedItems}) =>
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);

        if (item.config.metadata.ownerReferences)
        {
            for(var ref of item.config.metadata.ownerReferences)
            {
                var ownerItems =  namespaceScope.getAppOwners(ref.kind, ref.name);
                for(var ownerItem of ownerItems) 
                {
                    var shortName = NameHelpers.makeRelativeName(ownerItem.config.metadata.name, item.config.metadata.name);
                    createReplicaSet(ownerItem, { name: shortName });
                }
            }
        }

        if (!hasCreatedItems()) {
            var rawContainer = scope.fetchRawContainer(item, "ReplicaSets");
            createReplicaSet(rawContainer);
            createAlert('BestPractice', 'warn', null, 'Directly using ReplicaSet. Use Deploment, StatefulSet or DaemonSet instead.');
        }

        /*** HELPERS ***/
        function createReplicaSet(parent, params)
        {
            var k8sReplicaSet = createK8sItem(parent, params);
            namespaceScope.registerAppOwner(k8sReplicaSet);
            return k8sReplicaSet;
        }
    }
}