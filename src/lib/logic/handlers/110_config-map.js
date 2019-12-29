module.exports = {
    target: {
        api: "v1",
        kind: "ConfigMap"
    },

    kind: 'configmap',

    order: 110,

    handler: ({scope, item, createK8sItem, createAlert}) =>
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);
        var configMapScope = namespaceScope.configMaps[item.config.metadata.name];
        if (!configMapScope.used) {
            var rawContainer = scope.fetchRawContainer(item, "ConfigMaps");
            createK8sItem(rawContainer);
            createAlert('Unused', 'warn', null, 'ConfigMap not used.');
        }
    }
}