const NameHelpers = require("../../utils/name-helpers.js");

module.exports = {
    target: {
        api: "apps",
        kind: "ReplicaSet"
    },

    order: 90,

    handler: ({scope, item}) =>
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);

        var rawReplicaSets = scope.fetchRawContainer(item, "ReplicaSets");
        createReplicaSet(rawReplicaSets);

        if (item.config.metadata.ownerReferences)
        {
            for(var ref of item.config.metadata.ownerReferences)
            {
                var launcher = namespaceScope.findLauncher(ref.kind, ref.name);
                if (launcher)
                {
                    var shortName = NameHelpers.makeRelativeName(launcher.config.metadata.name, item.config.metadata.name);
                    createReplicaSet(launcher, { name: shortName });
                }
            }
        }

        /*** HELPERS ***/
        function createReplicaSet(parent, params)
        {
            params = params || {};
            var name = params.name || item.config.metadata.name;
            var k8sReplicaSet = parent.fetchByNaming("replicaset", name);
            scope.setK8sConfig(k8sReplicaSet, item.config);
            if (params.order) {
                k8sReplicaSet.order = params.order;
            }
            if (!namespaceScope.replicaSets[item.config.metadata.name]) {
                namespaceScope.replicaSets[item.config.metadata.name] = [];
            }
            namespaceScope.replicaSets[item.config.metadata.name].push(k8sReplicaSet);
            return k8sReplicaSet;
        }
    }
}