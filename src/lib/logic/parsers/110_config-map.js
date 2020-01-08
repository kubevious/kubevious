const _ = require("the-lodash");

module.exports = {
    target: {
        api: "v1",
        kind: "ConfigMap"
    },

    kind: 'configmap',

    order: 110,

    handler: ({logger, scope, item, createK8sItem, createAlert}) =>
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);
        var configMapScope = namespaceScope.configMaps[item.config.metadata.name];

        if (_.keys(configMapScope.usedBy).length > 0) 
        {
            if (_.keys(configMapScope.usedBy).length > 1)
            {
                for(var userDn of _.keys(configMapScope.usedBy))
                {
                    var user = scope.findItem(userDn);
                    if (!user) {
                        logger.error("Missing DN: %s", dn);
                    }
                    user.setFlag("shared");
                    for(var dn of _.keys(configMapScope.usedBy))
                    {
                        if (dn != userDn) {
                            user.setUsedBy(dn);
                        }
                    }
                }
            } 
        }
        else
        {
            var rawContainer = scope.fetchRawContainer(item, "ConfigMaps");
            createK8sItem(rawContainer);
            createAlert('Unused', 'warn', null, 'ConfigMap not used.');
        }
    }
}