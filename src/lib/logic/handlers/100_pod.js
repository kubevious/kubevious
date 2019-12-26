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
    }
}