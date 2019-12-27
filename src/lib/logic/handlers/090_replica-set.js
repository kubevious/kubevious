const NameHelpers = require("../../utils/name-helpers.js");

module.exports = {
    target: {
        api: "apps",
        kind: "ReplicaSet"
    },

    order: 90,

    handler: ({scope, item}) =>
    {
        var rawReplicaSets = scope.fetchRawContainer(item, "ReplicaSets");
        var k8sReplicaSet = rawReplicaSets.fetchByNaming("replicaset", item.config.metadata.name);
        scope.setK8sConfig(k8sReplicaSet, item.config);

        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);

        namespaceScope.replicaSets[item.config.metadata.name] = [k8sReplicaSet];

        if (item.config.metadata.ownerReferences)
        {
            for(var ref of item.config.metadata.ownerReferences)
            {
                var launcher = namespaceScope.findLauncher(ref.kind, ref.name);
                if (launcher)
                {
                    var shortName = NameHelpers.makeRelativeName(launcher.config.metadata.name, item.config.metadata.name);
                    var launcherReplicaSet = launcher.fetchByNaming("replicaset", shortName);
                    scope.setK8sConfig(launcherReplicaSet, item.config);

                    namespaceScope.replicaSets[item.config.metadata.name].push(launcherReplicaSet);
                }
            }
        }
    }
}