module.exports = {
    target: {
        api: "v1",
        kind: "Namespace"
    },

    order: 10,

    handler: ({scope, item}) =>
    {
        var namespace = scope.root.fetchByNaming("ns", item.config.metadata.name);
        scope.setK8sConfig(namespace, item.config);
    }
}