module.exports = {
    target: {
        api: "v1",
        kind: "ConfigMap"
    },

    order: 20,

    handler: ({scope, item}) =>
    {
        var rawConfigMaps = scope.fetchRawContainer(item, "ConfigMaps");
        var configmap = rawConfigMaps.fetchByNaming("configmap", item.config.metadata.name);
        scope.setK8sConfig(configmap, item.config);
    }
}