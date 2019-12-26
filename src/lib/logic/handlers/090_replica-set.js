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
    }
}