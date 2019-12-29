module.exports = {
    target: {
        api: "v1",
        kind: "ConfigMap"
    },

    kind: 'configmap',

    order: 20,

    handler: ({scope, item }) =>
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);
        namespaceScope.configMaps[item.config.metadata.name] = {
            used: false,
            config: item.config
        }
    }
}